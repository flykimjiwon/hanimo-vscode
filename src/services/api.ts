// Thin client for the Go server REST/SSE API. No state — caller passes baseUrl.
import { streamSse } from './sse';

export interface ConfigDTO {
  base_url: string;
  api_key: string; // masked
  super: string;
  dev: string;
  plan?: string;
  has_key: boolean;
  brand_tag: string;
  is_onprem?: boolean;
}

export interface ModelDTO {
  id: string;
  display_name: string;
  description: string;
  context_window?: number;
  supports_tools?: boolean;
  supports_vision?: boolean;
  supports_reasoning?: boolean;
}

export interface Symbol {
  name: string;
  kind: string;
  file: string;
  line: number;
}

export interface SymbolIndex {
  built_at: string;
  root: string;
  file_count: number;
  symbols: Symbol[];
}

export interface KnowledgeFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  enabled: boolean;
}

export interface Skill {
  name: string;
  path: string;
  size: number;
  modified: number;
  enabled: boolean;
  description: string;
}

export interface Permissions {
  tools: Record<string, 'allow' | 'deny' | 'ask'>;
  shell_deny: string[];
}

export class ApiClient {
  constructor(public baseUrl: string) {}

  async health(): Promise<{ status: string; cwd: string; model: string; version: string }> {
    return getJson(`${this.baseUrl}/health`);
  }

  async getConfig(): Promise<ConfigDTO> {
    return getJson(`${this.baseUrl}/config`);
  }

  async patchConfig(patch: Partial<ConfigDTO>): Promise<ConfigDTO> {
    const res = await fetch(`${this.baseUrl}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`PATCH /config failed: ${res.status}`);
    return res.json();
  }

  async listModels(): Promise<ModelDTO[]> {
    const j = await getJson<{ models: ModelDTO[] }>(`${this.baseUrl}/models`);
    return j.models;
  }

  // Refreshes the live model list from the active provider's /models endpoint.
  // Server caches with 24h TTL keyed on (provider, base_url). Subsequent
  // listModels() calls return the merged result.
  async refreshModels(provider?: string): Promise<{ provider: string; count: number; models: ModelDTO[] }> {
    const url = provider
      ? `${this.baseUrl}/models/refresh?provider=${encodeURIComponent(provider)}`
      : `${this.baseUrl}/models/refresh`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`POST /models/refresh failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async getKnowledge(): Promise<{ path: string; content: string }> {
    return getJson(`${this.baseUrl}/knowledge`);
  }

  async putKnowledge(content: string): Promise<{ path: string }> {
    const res = await fetch(`${this.baseUrl}/knowledge`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`PUT /knowledge failed: ${res.status}`);
    return res.json();
  }

  // Knowledge folder (.hanimo-knowledge/*.md)
  async listKnowledgeFiles(): Promise<{ dir: string; files: KnowledgeFile[] }> {
    return getJson(`${this.baseUrl}/knowledge/files`);
  }
  async readKnowledgeFile(name: string): Promise<{ path: string; content: string }> {
    return getJson(`${this.baseUrl}/knowledge/files?path=${encodeURIComponent(name)}`);
  }
  async writeKnowledgeFile(name: string, content: string): Promise<{ path: string }> {
    const res = await fetch(`${this.baseUrl}/knowledge/files`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: name, content }),
    });
    if (!res.ok) throw new Error(`PUT /knowledge/files failed: ${res.status}`);
    return res.json();
  }
  async deleteKnowledgeFile(name: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/knowledge/files?path=${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
  }

  // Skills (.hanimo-skills/*.md)
  async listSkills(): Promise<{ dir: string; skills: Skill[] }> {
    return getJson(`${this.baseUrl}/skills`);
  }
  async readSkill(name: string): Promise<{ path: string; content: string }> {
    return getJson(`${this.baseUrl}/skills?path=${encodeURIComponent(name)}`);
  }
  async writeSkill(name: string, content: string): Promise<{ path: string }> {
    const res = await fetch(`${this.baseUrl}/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: name, content }),
    });
    if (!res.ok) throw new Error(`PUT /skills failed: ${res.status}`);
    return res.json();
  }
  async deleteSkill(name: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/skills?path=${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
  }

  async confirmTool(id: string, approve: boolean, reason?: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approve, reason }),
    });
    if (!res.ok && res.status !== 204) throw new Error(`POST /confirm failed: ${res.status}`);
  }

  // Permissions
  async getPermissions(): Promise<Permissions> {
    return getJson(`${this.baseUrl}/permissions`);
  }
  async putPermissions(p: Permissions): Promise<Permissions> {
    const res = await fetch(`${this.baseUrl}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    });
    if (!res.ok) throw new Error(`PUT /permissions failed: ${res.status}`);
    return res.json();
  }
  async resetPermissions(): Promise<Permissions> {
    const res = await fetch(`${this.baseUrl}/permissions`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
    return res.json();
  }

  // User rules (~/.hanimo/rules.md)
  async getRules(): Promise<{ path: string; content: string }> {
    return getJson(`${this.baseUrl}/rules`);
  }
  async putRules(content: string): Promise<{ path: string }> {
    const res = await fetch(`${this.baseUrl}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`PUT /rules failed: ${res.status}`);
    return res.json();
  }

  async getSymbols(force = false): Promise<SymbolIndex> {
    return getJson(`${this.baseUrl}/index/symbols${force ? '?force=1' : ''}`);
  }

  chat(body: { prompt: string; mode?: string; max_turns?: number }, signal?: AbortSignal) {
    return streamSse(`${this.baseUrl}/chat`, body, signal);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}
