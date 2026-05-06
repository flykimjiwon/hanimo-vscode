import { useEffect, useRef, useState } from 'preact/hooks';
import { PlusIcon, Code, Send, Stop, ChevronDown, Close } from '../icons';
import { KnowledgeFile, Skill } from '../../services/api';
import { t, useLocale } from '../i18n';
import { useClickOutside } from '../hooks';

export interface Mention { id: string; label: string }

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: (mentions: string[], images: string[]) => void;
  onCancel: () => void;
  streaming: boolean;
  mode: string;
  onModeChange: (m: string) => void;
  disabled?: boolean;
  knowledgeFiles: KnowledgeFile[];
  skills: Skill[];
  onLoadKnowledgeFiles: () => void;
  onLoadSkills: () => void;
  // True when the active model accepts images. Composer warns the user
  // when they paste/drop while this is false.
  visionSupported?: boolean;
}

const MODES = [
  { id: 'super', label: 'Super', desc: '범용 — 자동 판단' },
  { id: 'dev', label: 'Deep Agent', desc: '자율 코딩 (긴 루프)' },
  { id: 'plan', label: 'Plan', desc: '계획부터 세움' },
];

export function Composer(p: Props) {
  useLocale();
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [images, setImages] = useState<string[]>([]); // data URLs

  const addImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (p.visionSupported === false) {
      // Don't block — just warn. User may know what they're doing.
      console.warn('[hanimo] 현재 모델이 이미지를 지원하지 않습니다. Gemma 4 등 비전 모델로 전환하세요.');
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') setImages((prev) => [...prev, result]);
    };
    reader.readAsDataURL(file);
  };
  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [p.value]);

  useEffect(() => {
    if (mentionOpen) { p.onLoadKnowledgeFiles(); p.onLoadSkills(); }
  }, [mentionOpen]);

  const mentionRef = useClickOutside<HTMLDivElement>(mentionOpen, () => setMentionOpen(false));
  const modeRef = useClickOutside<HTMLDivElement>(modeOpen, () => setModeOpen(false));

  const insertCodeBlock = () => {
    const ta = taRef.current; if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const before = p.value.slice(0, start);
    const sel = p.value.slice(start, end);
    const after = p.value.slice(end);
    const block = `\n\`\`\`\n${sel}\n\`\`\`\n`;
    p.onChange(before + block + after);
    requestAnimationFrame(() => {
      const pos = before.length + 4; // place cursor after opening fence
      ta.focus();
      ta.setSelectionRange(pos, pos + sel.length);
    });
  };

  const modeLabel = MODES.find((m) => m.id === p.mode)?.label ?? 'Super';

  const addMention = (m: Mention) => {
    if (!mentions.find((x) => x.id === m.id)) setMentions([...mentions, m]);
    setMentionOpen(false);
  };
  const removeMention = (id: string) => setMentions(mentions.filter((m) => m.id !== id));
  const submit = () => {
    p.onSend(mentions.map((m) => m.id), images);
    setMentions([]); setImages([]);
  };

  return (
    <div class="composer">
      {images.length > 0 && p.visionSupported === false && (
        <div style={{ fontSize: 11, color: '#ffa726', marginBottom: 6 }}>
          ⚠ 현재 모델은 이미지를 지원하지 않아요. 설정에서 Gemma 4 등 비전 모델로 바꾸세요.
        </div>
      )}
      {(mentions.length > 0 || images.length > 0) && (
        <div style={{ marginBottom: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {mentions.map((m) => (
            <span class="mention-chip">
              @{m.label}
              <span class="x" onClick={() => removeMention(m.id)}><Close size={10} /></span>
            </span>
          ))}
          {images.map((src, i) => (
            <span class="mention-chip" style={{ padding: 2 }}>
              <img src={src} style={{ height: 20, borderRadius: 2, verticalAlign: 'middle' }} />
              <span class="x" onClick={() => removeImage(i)}><Close size={10} /></span>
            </span>
          ))}
        </div>
      )}
      <textarea
        ref={taRef}
        value={p.value}
        placeholder={t('composer_placeholder')}
        onInput={(e) => p.onChange((e.target as HTMLTextAreaElement).value)}
        onPaste={(e) => {
          const items = e.clipboardData?.items;
          if (!items) return;
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (it.type.startsWith('image/')) {
              const file = it.getAsFile();
              if (file) { e.preventDefault(); addImageFile(file); }
            }
          }
        }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => {
          const files = e.dataTransfer?.files;
          if (!files || files.length === 0) return;
          e.preventDefault();
          for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) addImageFile(files[i]);
          }
        }}
        onKeyDown={(e) => {
          const ev: any = e;
          const composing = ev.isComposing || ev.keyCode === 229 || ev.nativeEvent?.isComposing;
          if (e.key === 'Enter' && !e.shiftKey && !composing) {
            e.preventDefault();
            if (!p.streaming && !p.disabled) submit();
          }
          if (e.key === '@') setMentionOpen(true);
        }}
      />
      <div class="row">
        <div style={{ position: 'relative' }} ref={mentionRef}>
          <button class="icon-btn" title="지식/스킬 첨부 (@)" onClick={() => setMentionOpen((o) => !o)}><PlusIcon /></button>
          {mentionOpen && (
            <div class="mention-dropdown">
              <div class="group">지식 파일</div>
              {p.knowledgeFiles.length === 0 && <div class="item" style={{ color: 'var(--hanimo-fg-faint)' }}>없음</div>}
              {p.knowledgeFiles.map((f) => (
                <div class="item" onClick={() => addMention({ id: `knowledge:${f.name}`, label: `kb/${f.name}` })}>{f.name}</div>
              ))}
              <div class="group">스킬</div>
              {p.skills.length === 0 && <div class="item" style={{ color: 'var(--hanimo-fg-faint)' }}>없음</div>}
              {p.skills.map((s) => (
                <div class="item" onClick={() => addMention({ id: `skill:${s.name}`, label: `skill/${s.name}` })}>
                  <div>{s.name}</div>
                  <div class="desc">{s.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button class="icon-btn" title="코드 블록 삽입" onClick={insertCodeBlock}><Code /></button>
        <div style={{ position: 'relative' }} ref={modeRef}>
          <button class="mode-chip" onClick={() => setModeOpen((o) => !o)} title="모드">
            {modeLabel} <ChevronDown size={10} />
          </button>
          {modeOpen && (
            <div class="dropdown" style={{ bottom: '100%', left: 0, marginBottom: 4 }}>
              {MODES.map((m) => (
                <div
                  class={`item ${p.mode === m.id ? 'active' : ''}`}
                  onClick={() => { p.onModeChange(m.id); setModeOpen(false); }}
                >
                  {m.label}
                  <span class="desc">{m.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {p.streaming ? (
          <button class="send-btn cancel" onClick={p.onCancel} title="중단"><Stop /></button>
        ) : (
          <button class="send-btn" onClick={submit} disabled={(!p.value.trim() && images.length === 0) || p.disabled} title="전송"><Send /></button>
        )}
      </div>
    </div>
  );
}
