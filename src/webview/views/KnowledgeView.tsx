import { useEffect, useState } from 'preact/hooks';
import { KnowledgeFile } from '../../services/api';
import { Markdown } from '../components/Markdown';
import { Trash, PlusIcon, Refresh } from '../icons';
import { ui } from '../dialog';

interface Props {
  dir: string;
  files: KnowledgeFile[];
  selected: { name: string; content: string } | null;
  projectMd: { path: string; content: string };
  onListFiles: () => void;
  onReadFile: (name: string) => void;
  onWriteFile: (name: string, content: string) => void;
  onDeleteFile: (name: string) => void;
  onLoadTechaiMd: () => void;
  onSaveTechaiMd: (content: string) => void;
  onBack: () => void;
}

export function KnowledgeView(p: Props) {
  const [activeName, setActiveName] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [draft, setDraft] = useState('');
  const [pinnedTab, setPinnedTab] = useState<'pinned' | 'folder'>('pinned');
  const [pinnedDraft, setPinnedDraft] = useState('');

  useEffect(() => { p.onListFiles(); p.onLoadTechaiMd(); }, []);
  useEffect(() => { setPinnedDraft(p.projectMd.content); }, [p.projectMd.content]);
  useEffect(() => {
    if (p.selected && p.selected.name === activeName) setDraft(p.selected.content);
  }, [p.selected]);

  const open = (name: string) => {
    setActiveName(name);
    setMode('view');
    p.onReadFile(name);
  };

  const newFile = async () => {
    const name = (await ui.prompt('새 .md 파일 이름', 'api-guide.md'))?.trim();
    if (!name) return;
    const safe = /\.md$/i.test(name) ? name : `${name}.md`;
    p.onWriteFile(safe, `# ${safe.replace(/\.md$/i, '')}\n\n`);
    setActiveName(safe);
    setMode('edit');
    setDraft(`# ${safe.replace(/\.md$/i, '')}\n\n`);
  };

  return (
    <div class="view-pane" style={{ padding: 12 }}>
      <div class="viewer-toolbar">
        <button class={`toggle-btn ${pinnedTab === 'pinned' ? 'active' : ''}`} onClick={() => setPinnedTab('pinned')}>.hanimo.md (프로젝트)</button>
        <button class={`toggle-btn ${pinnedTab === 'folder' ? 'active' : ''}`} onClick={() => setPinnedTab('folder')}>지식 폴더</button>
        <button class="toggle-btn" style={{ marginLeft: 'auto' }} onClick={p.onBack}>뒤로</button>
      </div>

      {pinnedTab === 'pinned' ? (
        <PinnedEditor
          path={p.projectMd.path}
          value={pinnedDraft}
          onChange={setPinnedDraft}
          onSave={() => p.onSaveTechaiMd(pinnedDraft)}
        />
      ) : (
        <FolderView
          dir={p.dir}
          files={p.files}
          activeName={activeName}
          mode={mode}
          draft={draft}
          selected={p.selected}
          onSelect={open}
          onNew={newFile}
          onRefresh={p.onListFiles}
          onDelete={async (name) => { if (await ui.confirm(`${name} 삭제하시겠습니까?`)) { p.onDeleteFile(name); if (activeName === name) setActiveName(null); } }}
          onModeChange={setMode}
          onDraftChange={setDraft}
          onSave={() => activeName && p.onWriteFile(activeName, draft)}
        />
      )}
    </div>
  );
}

function PinnedEditor({ path, value, onChange, onSave }: { path: string; value: string; onChange: (v: string) => void; onSave: () => void }) {
  const [tab, setTab] = useState<'view' | 'edit'>('edit');
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--hanimo-fg-dim)', marginBottom: 6 }}>
        {path || '아직 없음 — 저장 시 생성됨'}
      </div>
      <div class="viewer-toolbar">
        <button class={`toggle-btn ${tab === 'view' ? 'active' : ''}`} onClick={() => setTab('view')}>미리보기</button>
        <button class={`toggle-btn ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}>편집</button>
      </div>
      {tab === 'edit' ? (
        <textarea value={value} onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)} />
      ) : (
        <Markdown text={value || '_(비어있음)_'} />
      )}
      <div class="actions">
        <button class="btn-primary" onClick={onSave}>저장</button>
      </div>
    </div>
  );
}

function FolderView(p: {
  dir: string;
  files: KnowledgeFile[];
  activeName: string | null;
  mode: 'view' | 'edit';
  draft: string;
  selected: { name: string; content: string } | null;
  onSelect: (n: string) => void;
  onNew: () => void;
  onRefresh: () => void;
  onDelete: (n: string) => void;
  onModeChange: (m: 'view' | 'edit') => void;
  onDraftChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--hanimo-fg-dim)', marginBottom: 8 }}>
        {p.dir || '.hanimo-knowledge/'} — 활성 .md 파일들이 모든 채팅에 자동 prepend 됩니다. _name.md 처럼 _로 시작하면 비활성.
      </div>
      <div class="split" style={{ minHeight: 400 }}>
        <div class="pane left">
          <div class="viewer-toolbar">
            <button class="toggle-btn" onClick={p.onNew}><PlusIcon size={11} /> 새 파일</button>
            <button class="toggle-btn" onClick={p.onRefresh} title="새로고침"><Refresh size={11} /></button>
          </div>
          <div class="file-list">
            {p.files.length === 0 && <div style={{ color: 'var(--hanimo-fg-dim)', fontSize: 11, padding: 6 }}>파일 없음</div>}
            {p.files.map((f) => (
              <div class={`file-row ${p.activeName === f.name ? 'active' : ''}`} onClick={() => p.onSelect(f.name)}>
                <span class="name">{f.enabled ? '' : '⏸ '}{f.name}</span>
                <button class="x" onClick={(e) => { e.stopPropagation(); p.onDelete(f.name); }} title="삭제"><Trash size={10} /></button>
              </div>
            ))}
          </div>
        </div>
        <div class="pane right">
          {!p.activeName ? (
            <div style={{ color: 'var(--hanimo-fg-dim)', padding: 20 }}>왼쪽에서 파일을 선택하거나 새로 만들어주세요.</div>
          ) : (
            <>
              <div class="viewer-toolbar">
                <button class={`toggle-btn ${p.mode === 'view' ? 'active' : ''}`} onClick={() => p.onModeChange('view')}>미리보기</button>
                <button class={`toggle-btn ${p.mode === 'edit' ? 'active' : ''}`} onClick={() => p.onModeChange('edit')}>편집</button>
              </div>
              {p.mode === 'edit' ? (
                <textarea value={p.draft} onInput={(e) => p.onDraftChange((e.target as HTMLTextAreaElement).value)} />
              ) : (
                <Markdown text={p.selected?.content || ''} />
              )}
              {p.mode === 'edit' && (
                <div class="actions">
                  <button class="btn-primary" onClick={p.onSave}>저장</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
