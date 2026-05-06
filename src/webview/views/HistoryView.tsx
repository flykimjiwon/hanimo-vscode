import { ChatSession } from '../state';
import { Trash } from '../icons';

interface Props {
  sessions: ChatSession[];
  activeId: string | null;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function HistoryView({ sessions, activeId, onSwitch, onDelete, onBack }: Props) {
  return (
    <div class="view-pane">
      <h2>채팅 기록</h2>
      {sessions.length === 0 && (
        <div style={{ color: 'var(--hanimo-fg-dim)', fontSize: 12 }}>아직 채팅 기록이 없어요.</div>
      )}
      <ul class="history-list">
        {sessions.map((s) => (
          <li
            class={`history-item ${s.id === activeId ? 'active' : ''}`}
            onClick={() => onSwitch(s.id)}
          >
            <div class="title">{s.title}</div>
            <div class="when">{relTime(s.updatedAt)}</div>
            <button
              class="x"
              title="삭제"
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
            >
              <Trash />
            </button>
          </li>
        ))}
      </ul>
      <div class="actions"><button class="btn-secondary" onClick={onBack}>뒤로</button></div>
    </div>
  );
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return '방금';
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + '분 전';
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + '시간 전';
  return Math.floor(diff / 86_400_000) + '일 전';
}
