// Shared types between WebView components. Mirrors the extension-side
// store/chatStore types — kept minimal to avoid cross-imports.
export type ChatTurn =
  | { kind: 'user'; text: string; ts: number }
  | { kind: 'assistant'; text: string; ts: number }
  | { kind: 'tool'; id: string; name: string; args: string; result?: string; aborted?: boolean; ts: number };

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: string;
  turns: ChatTurn[];
}

export type ViewName = 'chat' | 'settings' | 'history' | 'knowledge' | 'skills' | 'permissions';
