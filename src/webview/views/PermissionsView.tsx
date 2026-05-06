import { useEffect, useState } from 'preact/hooks';
import { Permissions } from '../../services/api';

interface Props {
  perms: Permissions | null;
  onLoad: () => void;
  onSave: (p: Permissions) => void;
  onReset: () => void;
  onBack: () => void;
}

const TOOL_DESC: Record<string, { label: string; risky?: boolean; group: string }> = {
  file_read:        { label: '파일 읽기',                   group: '읽기' },
  list_files:       { label: '파일 목록',                   group: '읽기' },
  grep_search:      { label: '내용 검색 (grep)',            group: '읽기' },
  glob_search:      { label: '파일 패턴 검색 (glob)',        group: '읽기' },
  hashline_read:    { label: '해시라인 읽기',                group: '읽기' },
  git_status:       { label: 'git status',                   group: 'Git' },
  git_diff:         { label: 'git diff',                     group: 'Git' },
  git_log:          { label: 'git log',                      group: 'Git' },
  diagnostics:      { label: '진단',                         group: '읽기' },
  knowledge_search: { label: '지식 검색',                    group: '읽기' },
  file_write:       { label: '파일 쓰기',         risky: true, group: '쓰기' },
  file_edit:        { label: '파일 편집',         risky: true, group: '쓰기' },
  hashline_edit:    { label: '해시라인 편집',     risky: true, group: '쓰기' },
  apply_patch:      { label: '패치 적용',         risky: true, group: '쓰기' },
  shell_exec:       { label: '셸 명령 실행',      risky: true, group: '실행' },
};

const PROFILES = {
  open: '모든 도구 허용',
  safe: '안전 — 셸은 패턴 차단, 쓰기 도구는 허용',
  readonly: '읽기 전용 — 모든 쓰기/실행 도구 차단',
};

export function PermissionsView({ perms, onLoad, onSave, onReset, onBack }: Props) {
  const [draft, setDraft] = useState<Permissions | null>(perms);
  const [shellText, setShellText] = useState('');

  useEffect(() => { onLoad(); }, []);
  useEffect(() => {
    if (perms) {
      setDraft(perms);
      setShellText(perms.shell_deny.join('\n'));
    }
  }, [perms]);

  if (!draft) return <div class="view-pane">로딩…</div>;

  const setTool = (name: string, mode: 'allow' | 'deny' | 'ask') => {
    setDraft({ ...draft, tools: { ...draft.tools, [name]: mode } });
  };

  const applyProfile = (name: keyof typeof PROFILES) => {
    const tools = { ...draft.tools };
    if (name === 'open') Object.keys(tools).forEach((k) => (tools[k] = 'allow'));
    if (name === 'readonly') {
      Object.keys(TOOL_DESC).forEach((k) => (tools[k] = TOOL_DESC[k].risky ? 'deny' : 'allow'));
    }
    if (name === 'safe') {
      Object.keys(TOOL_DESC).forEach((k) => {
        tools[k] = TOOL_DESC[k].risky ? 'ask' : 'allow';
      });
    }
    setDraft({ ...draft, tools });
  };

  const save = () => {
    onSave({
      tools: draft.tools,
      shell_deny: shellText.split('\n').map((s) => s.trim()).filter(Boolean),
    });
  };

  const groups = ['읽기', 'Git', '쓰기', '실행'];

  return (
    <div class="view-pane">
      <h2>권한 정책</h2>
      <div style={{ fontSize: 11, color: 'var(--hanimo-fg-dim)', marginBottom: 12 }}>
        ~/.hanimo/permissions.yaml — TUI 와 공유. 변경 즉시 적용.
      </div>

      <h3>프로필</h3>
      <div class="actions" style={{ marginBottom: 12 }}>
        {(Object.keys(PROFILES) as Array<keyof typeof PROFILES>).map((p) => (
          <button class="btn-secondary" onClick={() => applyProfile(p)} title={PROFILES[p]}>
            {p === 'open' ? '🔓 Open' : p === 'safe' ? '🛡 Safe' : '👁 Read-only'}
          </button>
        ))}
      </div>

      <h3>도구별</h3>
      {groups.map((g) => (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--hanimo-fg-dim)', marginBottom: 4 }}>{g}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(TOOL_DESC).filter(([, v]) => v.group === g).map(([name, info]) => {
              const mode = draft.tools[name] || 'allow';
              return (
                <div style={{ display: 'flex', alignItems: 'center', padding: '4px 6px', borderRadius: 4 }}>
                  <span style={{ flex: 1, fontSize: 12 }}>
                    {info.label} <span style={{ fontFamily: 'var(--vscode-editor-font-family)', fontSize: 11, color: 'var(--hanimo-fg-faint)' }}>{name}</span>
                    {info.risky && <span style={{ marginLeft: 6, fontSize: 10, color: '#ffa726' }}>⚠</span>}
                  </span>
                  <div style={{ display: 'flex', gap: 0 }}>
                    <button
                      class={`toggle-btn ${mode === 'allow' ? 'active' : ''}`}
                      style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                      onClick={() => setTool(name, 'allow')}
                    >허용</button>
                    <button
                      class={`toggle-btn ${mode === 'ask' ? 'active' : ''}`}
                      style={{ borderRadius: 0, borderLeft: 0 }}
                      onClick={() => setTool(name, 'ask')}
                    >확인</button>
                    <button
                      class={`toggle-btn ${mode === 'deny' ? 'active' : ''}`}
                      style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 0 }}
                      onClick={() => setTool(name, 'deny')}
                    >차단</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <h3>셸 명령 차단 패턴 (정규식)</h3>
      <div style={{ fontSize: 11, color: 'var(--hanimo-fg-dim)', marginBottom: 4 }}>
        한 줄에 하나씩. shell_exec 호출 시 명령어가 이 패턴 중 하나에 매치하면 거부됩니다.
      </div>
      <textarea
        value={shellText}
        onInput={(e) => setShellText((e.target as HTMLTextAreaElement).value)}
        style={{ minHeight: 120, fontFamily: 'var(--vscode-editor-font-family)', fontSize: 11 }}
        placeholder={`\\brm\\s+-rf\\s+/\n\\bsudo\\s+rm\\b\n\\bgit\\s+push\\s+.*--force\\b`}
      />

      <div class="actions">
        <button class="btn-primary" onClick={save}>저장</button>
        <button class="btn-secondary" onClick={onReset}>기본값으로 초기화</button>
        <button class="btn-secondary" onClick={onBack}>뒤로</button>
      </div>
    </div>
  );
}
