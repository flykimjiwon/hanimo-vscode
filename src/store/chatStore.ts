// Persists chat sessions in VS Code globalState. Each session is a list
// of turns plus a generated title (derived from the first user message).
import * as vscode from 'vscode';

export type Turn =
  | { kind: 'user'; text: string; ts: number }
  | { kind: 'assistant'; text: string; ts: number }
  | { kind: 'tool'; id: string; name: string; args: string; result?: string; aborted?: boolean; ts: number };

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: string; // 'super' | 'dev' | 'plan'
  turns: Turn[];
}

const KEY_INDEX = 'hanimoCode.chatIndex';
const KEY_PREFIX = 'hanimoCode.chat:';

export class ChatStore {
  constructor(private readonly mem: vscode.Memento) {}

  list(): ChatSession[] {
    const ids = this.mem.get<string[]>(KEY_INDEX, []);
    return ids
      .map((id) => this.mem.get<ChatSession>(KEY_PREFIX + id))
      .filter((s): s is ChatSession => !!s)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): ChatSession | undefined {
    return this.mem.get<ChatSession>(KEY_PREFIX + id);
  }

  async create(mode: string = 'super'): Promise<ChatSession> {
    const id = newId();
    const session: ChatSession = {
      id,
      title: '새 채팅',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode,
      turns: [],
    };
    await this.save(session);
    const ids = this.mem.get<string[]>(KEY_INDEX, []);
    await this.mem.update(KEY_INDEX, [id, ...ids]);
    return session;
  }

  async save(session: ChatSession): Promise<void> {
    session.updatedAt = Date.now();
    if (session.turns.length > 0 && session.title === '새 채팅') {
      const first = session.turns.find((t) => t.kind === 'user');
      if (first) session.title = (first as { text: string }).text.slice(0, 40);
    }
    await this.mem.update(KEY_PREFIX + session.id, session);
  }

  async rename(id: string, title: string): Promise<void> {
    const s = this.get(id);
    if (!s) return;
    s.title = title.trim() || s.title;
    await this.save(s);
  }

  async remove(id: string): Promise<void> {
    const ids = this.mem.get<string[]>(KEY_INDEX, []);
    await this.mem.update(KEY_INDEX, ids.filter((x) => x !== id));
    await this.mem.update(KEY_PREFIX + id, undefined);
  }
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
