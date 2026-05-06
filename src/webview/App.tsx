import { useEffect, useRef, useState } from 'preact/hooks';
import { ChatSession, ChatTurn, ViewName } from './state';
import { ConfigDTO, ModelDTO, KnowledgeFile, Skill, Permissions } from '../services/api';
import { Header } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { Composer } from './components/Composer';
import { BottomBar } from './components/BottomBar';
import { Turn } from './components/Turn';
import { SettingsView } from './views/SettingsView';
import { HistoryView } from './views/HistoryView';
import { KnowledgeView } from './views/KnowledgeView';
import { SkillsView } from './views/SkillsView';
import { PermissionsView } from './views/PermissionsView';
import { ConfirmModal } from './components/ConfirmModal';
import { vscode } from './vscode';

type Status = 'idle' | 'streaming' | 'error';

export function App() {
  const [view, setView] = useState<ViewName>('chat');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [config, setConfig] = useState<ConfigDTO | null>(null);
  const [models, setModels] = useState<ModelDTO[]>([]);
  const [projectMd, setProjectMd] = useState<{ path: string; content: string }>({ path: '', content: '' });
  const [kbDir, setKbDir] = useState('');
  const [kbFiles, setKbFiles] = useState<KnowledgeFile[]>([]);
  const [kbSelected, setKbSelected] = useState<{ name: string; content: string } | null>(null);
  const [skillDir, setSkillDir] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSelected, setSkillSelected] = useState<{ name: string; content: string } | null>(null);
  const [rules, setRules] = useState<{ path: string; content: string }>({ path: '', content: '' });
  const [perms, setPerms] = useState<Permissions | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ id: string; name: string; args: string } | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [input, setInput] = useState('');
  const turnsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    vscode.postMessage({ type: 'ready' });
    vscode.postMessage({ type: 'listModels' });
    const onMsg = (ev: MessageEvent) => {
      const m = ev.data;
      switch (m.type) {
        case 'server_ready': setConfig(m.config); break;
        case 'config': setConfig(m.config); break;
        case 'models': setModels(m.models); break;
        case 'session': setSession({ ...m.session }); break;
        case 'session_list': setSessions(m.sessions); break;
        case 'turn_appended':
          setSession((s) => s ? ({ ...s, turns: [...s.turns, m.turn] }) : s);
          break;
        case 'content':
          setSession((s) => {
            if (!s) return s;
            const turns = [...s.turns];
            const last = turns[turns.length - 1];
            if (last && last.kind === 'assistant') {
              turns[turns.length - 1] = { ...last, text: last.text + (m.text || '') };
            } else {
              turns.push({ kind: 'assistant', text: m.text || '', ts: Date.now() });
            }
            return { ...s, turns };
          });
          break;
        case 'tool_call':
          setSession((s) => s ? ({
            ...s,
            turns: [...s.turns, { kind: 'tool', id: m.id, name: m.name, args: m.arguments, ts: Date.now() }],
          }) : s);
          break;
        case 'tool_result':
          setSession((s) => s ? ({
            ...s,
            turns: s.turns.map((t) =>
              t.kind === 'tool' && t.id === m.id ? { ...t, result: m.result, aborted: !!m.aborted } : t,
            ),
          }) : s);
          break;
        case 'usage': setTotalTokens(m.total_tokens || 0); break;
        case 'status':
          setStatus(m.status);
          if (m.status === 'error') setErrorMsg(m.message || '');
          break;
        case 'navigate': setView(m.view); break;
        case 'inject_selection':
          setInput((prev) => `${prev}\n@file ${m.filePath}\n\n\`\`\`\n${m.text}\n\`\`\`\n`);
          break;
        case 'knowledge': setProjectMd({ path: m.path, content: m.content }); break;
        case 'knowledge_files': setKbDir(m.dir); setKbFiles(m.files); break;
        case 'knowledge_file': setKbSelected({ name: m.name, content: m.content }); break;
        case 'skills_list': setSkillDir(m.dir); setSkills(m.skills); break;
        case 'skill_file': setSkillSelected({ name: m.name, content: m.content }); break;
        case 'rules': setRules({ path: m.path, content: m.content }); break;
        case 'permissions': setPerms(m.perms); break;
        case 'tool_confirm':
          setPendingConfirm({ id: m.id, name: m.name, args: m.arguments });
          break;
        case 'toast':
          setToast({ kind: m.kind, message: m.message });
          setTimeout(() => setToast(null), 2500);
          break;
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    turnsRef.current?.scrollTo({ top: turnsRef.current.scrollHeight });
  }, [session?.turns.length]);

  const send = (mentions: string[], images: string[]) => {
    const text = input.trim();
    if ((!text && images.length === 0) || status === 'streaming') return;
    // First-run UX: if API key is missing, redirect to settings instead of
    // sending. The server would 412 anyway and the empty/disabled state
    // confused users.
    if (!config?.has_key) {
      setView('settings');
      setErrorMsg('API 키를 먼저 입력하세요');
      setStatus('error');
      return;
    }
    vscode.postMessage({ type: 'send', prompt: text, mode: session?.mode, mentions, images });
    setInput('');
  };
  const cancel = () => vscode.postMessage({ type: 'cancel' });
  const newChat = () => vscode.postMessage({ type: 'newChat' });
  const switchChat = (id: string) => { vscode.postMessage({ type: 'switchChat', id }); setView('chat'); };
  const deleteChat = (id: string) => vscode.postMessage({ type: 'deleteChat', id });
  const apply = (filePath: string, content: string) => vscode.postMessage({ type: 'apply', filePath, content });
  const diff = (filePath: string, content: string) => vscode.postMessage({ type: 'diff', filePath, content });
  const patchConfig = (patch: Partial<ConfigDTO>) => vscode.postMessage({ type: 'patchConfig', patch });
  const listModels = () => vscode.postMessage({ type: 'listModels' });
  const reindex = () => vscode.postMessage({ type: 'reindexSymbols' });

  const loadProjectMd = () => vscode.postMessage({ type: 'getKnowledge' });
  const saveProjectMd = (content: string) => vscode.postMessage({ type: 'putKnowledge', content });
  const listKbFiles = () => vscode.postMessage({ type: 'listKnowledgeFiles' });
  const readKbFile = (name: string) => vscode.postMessage({ type: 'readKnowledgeFile', name });
  const writeKbFile = (name: string, content: string) => vscode.postMessage({ type: 'writeKnowledgeFile', name, content });
  const deleteKbFile = (name: string) => vscode.postMessage({ type: 'deleteKnowledgeFile', name });

  const listSkills = () => vscode.postMessage({ type: 'listSkills' });
  const readSkill = (name: string) => vscode.postMessage({ type: 'readSkill', name });
  const writeSkill = (name: string, content: string) => vscode.postMessage({ type: 'writeSkill', name, content });
  const deleteSkill = (name: string) => vscode.postMessage({ type: 'deleteSkill', name });

  const loadRules = () => vscode.postMessage({ type: 'getRules' });
  const saveRules = (content: string) => vscode.postMessage({ type: 'putRules', content });

  const loadPerms = () => vscode.postMessage({ type: 'getPermissions' });
  const savePerms = (p: Permissions) => vscode.postMessage({ type: 'putPermissions', perms: p });
  const resetPerms = () => vscode.postMessage({ type: 'resetPermissions' });
  const revealCwd = () => vscode.postMessage({ type: 'revealCwd' });
  const confirmTool = (id: string, approve: boolean) => {
    vscode.postMessage({ type: 'confirmTool', id, approve });
    setPendingConfirm(null);
  };

  const setMode = (mode: string) => session && setSession({ ...session, mode });

  const renderBody = () => {
    if (view === 'settings') return <SettingsView config={config} models={models} rules={rules} onPatch={patchConfig} onListModels={listModels} onBack={() => setView('chat')} onReindex={reindex} onLoadRules={loadRules} onSaveRules={saveRules} />;
    if (view === 'history') return <HistoryView sessions={sessions} activeId={session?.id ?? null} onSwitch={switchChat} onDelete={deleteChat} onBack={() => setView('chat')} />;
    if (view === 'knowledge') return <KnowledgeView dir={kbDir} files={kbFiles} selected={kbSelected} projectMd={projectMd} onListFiles={listKbFiles} onReadFile={readKbFile} onWriteFile={writeKbFile} onDeleteFile={deleteKbFile} onLoadTechaiMd={loadProjectMd} onSaveTechaiMd={saveProjectMd} onBack={() => setView('chat')} />;
    if (view === 'skills') return <SkillsView dir={skillDir} skills={skills} selected={skillSelected} onList={listSkills} onRead={readSkill} onWrite={writeSkill} onDelete={deleteSkill} onBack={() => setView('chat')} />;
    if (view === 'permissions') return <PermissionsView perms={perms} onLoad={loadPerms} onSave={savePerms} onReset={resetPerms} onBack={() => setView('chat')} />;

    const turns: ChatTurn[] = session?.turns ?? [];
    return (
      <>
        <div class="turns" ref={turnsRef}>
          {turns.length === 0 ? (
            <>
              {!config?.has_key && (
                <div style={{
                  margin: '12px',
                  padding: '10px 14px',
                  background: 'var(--hanimo-accent-glow)',
                  border: '1px solid var(--hanimo-accent)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--hanimo-accent)',
                  cursor: 'pointer',
                }} onClick={() => setView('settings')}>
                  ⚠ <strong>API 키 미설정</strong> — 클릭해서 설정 화면으로 이동
                </div>
              )}
              <EmptyState onSuggest={(p) => setInput(p)} />
            </>
          ) : (
            turns.map((turn, i) => (
              <Turn
                key={i}
                turn={turn}
                streaming={status === 'streaming' && i === turns.length - 1}
                onApply={apply}
                onDiff={diff}
              />
            ))
          )}
          {status === 'error' && errorMsg && <div class="error-row">⚠ {errorMsg}</div>}
        </div>
        <Composer
          value={input}
          onChange={setInput}
          onSend={send}
          onCancel={cancel}
          streaming={status === 'streaming'}
          mode={session?.mode || 'super'}
          onModeChange={setMode}
          disabled={false}
          knowledgeFiles={kbFiles}
          skills={skills}
          onLoadKnowledgeFiles={listKbFiles}
          onLoadSkills={listSkills}
          visionSupported={(() => {
            const id = config?.super;
            if (!id) return undefined;
            const m = models.find((x) => x.id === id);
            return m?.supports_vision;
          })()}
        />
        <BottomBar
          cwd={null}
          model={config?.super ?? null}
          totalTokens={totalTokens}
          onClickLocal={revealCwd}
          onClickPermissions={() => setView('permissions')}
        />
      </>
    );
  };

  return (
    <div class="app">
      <Header view={view} onNavigate={setView} />
      {renderBody()}
      {pendingConfirm && (
        <ConfirmModal
          toolName={pendingConfirm.name}
          args={pendingConfirm.args}
          onApprove={() => confirmTool(pendingConfirm.id, true)}
          onDeny={() => confirmTool(pendingConfirm.id, false)}
        />
      )}
      {toast && (
        <div class={`toast toast-${toast.kind}`}>{toast.message}</div>
      )}
    </div>
  );
}
