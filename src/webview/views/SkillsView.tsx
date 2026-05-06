import { useEffect, useState } from 'preact/hooks';
import { Skill } from '../../services/api';
import { Markdown } from '../components/Markdown';
import { Trash, PlusIcon, Refresh } from '../icons';
import { ui } from '../dialog';

interface Props {
  dir: string;
  skills: Skill[];
  selected: { name: string; content: string } | null;
  onList: () => void;
  onRead: (n: string) => void;
  onWrite: (n: string, content: string) => void;
  onDelete: (n: string) => void;
  onBack: () => void;
}

const TEMPLATE = (name: string) => `---
name: ${name.replace(/\.md$/i, '')}
description: 한 줄로 이 스킬이 무엇을 위한 건지
---

# ${name.replace(/\.md$/i, '')}

## When to use
-

## How to apply
-

## Examples
-
`;

export function SkillsView(p: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [draft, setDraft] = useState('');

  useEffect(() => { p.onList(); }, []);
  useEffect(() => {
    if (p.selected && p.selected.name === active) setDraft(p.selected.content);
  }, [p.selected]);

  const newSkill = async () => {
    const name = (await ui.prompt('새 스킬 이름', 'code-review.md'))?.trim();
    if (!name) return;
    const safe = /\.md$/i.test(name) ? name : `${name}.md`;
    p.onWrite(safe, TEMPLATE(safe));
    setActive(safe); setMode('edit'); setDraft(TEMPLATE(safe));
  };

  return (
    <div class="view-pane" style={{ padding: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--hanimo-fg-dim)', marginBottom: 8 }}>
        {p.dir || '.hanimo-skills/'} — 스킬 인덱스(이름+설명)가 시스템 프롬프트에 노출됩니다. AI가 필요할 때 file_read 로 본문을 로드합니다.
      </div>
      <div class="split" style={{ minHeight: 400 }}>
        <div class="pane left">
          <div class="viewer-toolbar">
            <button class="toggle-btn" onClick={newSkill}><PlusIcon size={11} /> 새 스킬</button>
            <button class="toggle-btn" onClick={p.onList}><Refresh size={11} /></button>
            <button class="toggle-btn" style={{ marginLeft: 'auto' }} onClick={p.onBack}>뒤로</button>
          </div>
          <div class="file-list">
            {p.skills.length === 0 && <div style={{ color: 'var(--hanimo-fg-dim)', fontSize: 11, padding: 6 }}>스킬 없음</div>}
            {p.skills.map((s) => (
              <div
                class={`file-row ${active === s.name ? 'active' : ''}`}
                onClick={() => { setActive(s.name); setMode('view'); p.onRead(s.name); }}
                title={s.description}
              >
                <span class="name">{s.enabled ? '' : '⏸ '}{s.name}</span>
                <button class="x" onClick={async (e) => { e.stopPropagation(); if (await ui.confirm(`${s.name} 삭제하시겠습니까?`)) p.onDelete(s.name); }}><Trash size={10} /></button>
              </div>
            ))}
          </div>
        </div>
        <div class="pane right">
          {!active ? (
            <div style={{ color: 'var(--hanimo-fg-dim)', padding: 20 }}>스킬 = 자주 쓰는 워크플로우. AI가 필요할 때 자동으로 참고합니다.</div>
          ) : (
            <>
              <div class="viewer-toolbar">
                <button class={`toggle-btn ${mode === 'view' ? 'active' : ''}`} onClick={() => setMode('view')}>미리보기</button>
                <button class={`toggle-btn ${mode === 'edit' ? 'active' : ''}`} onClick={() => setMode('edit')}>편집</button>
              </div>
              {mode === 'edit' ? (
                <textarea value={draft} onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)} />
              ) : (
                <Markdown text={p.selected?.content || ''} />
              )}
              {mode === 'edit' && (
                <div class="actions">
                  <button class="btn-primary" onClick={() => p.onWrite(active, draft)}>저장</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
