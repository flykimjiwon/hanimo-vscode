// Bridges the WebView <-> Go server. Owns the API client, current session,
// and message routing. The WebView is dumb: it renders state and emits intent.
import * as vscode from 'vscode';
import * as path from 'node:path';
import { TgcServer } from './server';
import { ApiClient } from './services/api';
import { ChatStore, ChatSession, Turn } from './store/chatStore';

type Inbox =
  | { type: 'ready' }
  | { type: 'send'; prompt: string; mode?: string; mentions?: string[]; images?: string[] }
  | { type: 'cancel' }
  | { type: 'newChat' }
  | { type: 'switchChat'; id: string }
  | { type: 'deleteChat'; id: string }
  | { type: 'renameChat'; id: string; title: string }
  | { type: 'apply'; filePath: string; content: string }
  | { type: 'diff'; filePath: string; content: string }
  | { type: 'getConfig' }
  | { type: 'patchConfig'; patch: any }
  | { type: 'listModels' }
  | { type: 'getKnowledge' }
  | { type: 'putKnowledge'; content: string }
  | { type: 'reindexSymbols' }
  | { type: 'listKnowledgeFiles' }
  | { type: 'readKnowledgeFile'; name: string }
  | { type: 'writeKnowledgeFile'; name: string; content: string }
  | { type: 'deleteKnowledgeFile'; name: string }
  | { type: 'listSkills' }
  | { type: 'readSkill'; name: string }
  | { type: 'writeSkill'; name: string; content: string }
  | { type: 'deleteSkill'; name: string }
  | { type: 'getRules' }
  | { type: 'putRules'; content: string }
  | { type: 'getPermissions' }
  | { type: 'putPermissions'; perms: any }
  | { type: 'resetPermissions' }
  | { type: 'revealCwd' }
  | { type: 'confirmTool'; id: string; approve: boolean; reason?: string }
  | { type: 'promptInput'; id: number; title: string; placeholder?: string; value?: string }
  | { type: 'confirmDialog'; id: number; message: string; detail?: string }
  | { type: 'openExternal'; url: string };

export class ChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'hanimoCode.chat';
  private view: vscode.WebviewView | null = null;
  private currentAbort: AbortController | null = null;
  private api: ApiClient | null = null;
  private session: ChatSession | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly server: TgcServer,
    private readonly store: ChatStore,
    private readonly output: vscode.OutputChannel,
  ) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
    };
    view.webview.html = this.renderHtml(view.webview);

    view.webview.onDidReceiveMessage((msg: Inbox) => {
      this.handleInbox(msg).catch((err) => this.output.appendLine(`[chatView] ${err}`));
    });
  }

  newChat() {
    void this.openNewSession();
  }

  openSettings() {
    this.view?.show?.(true);
    this.post({ type: 'navigate', view: 'settings' });
  }

  openHistory() {
    this.view?.show?.(true);
    this.post({ type: 'navigate', view: 'history' });
  }

  injectSelection(filePath: string, text: string) {
    this.view?.show?.(true);
    this.post({ type: 'inject_selection', filePath, text });
  }

  // ---- inbox handlers ----------------------------------------------------

  private async handleInbox(msg: Inbox) {
    switch (msg.type) {
      case 'ready':
        return this.handleReady();
      case 'send':
        return this.handleSend(msg.prompt, msg.mode, msg.mentions, msg.images);
      case 'cancel':
        this.currentAbort?.abort();
        return;
      case 'newChat':
        return this.openNewSession();
      case 'switchChat':
        return this.switchChat(msg.id);
      case 'deleteChat':
        await this.store.remove(msg.id);
        if (this.session?.id === msg.id) await this.openNewSession();
        else this.pushSessionList();
        return;
      case 'renameChat':
        await this.store.rename(msg.id, msg.title);
        return this.pushSessionList();
      case 'apply':
        return this.handleApply(msg.filePath, msg.content);
      case 'diff':
        return this.handleDiff(msg.filePath, msg.content);
      case 'getConfig':
        return this.handleGetConfig();
      case 'patchConfig':
        return this.handlePatchConfig(msg.patch);
      case 'listModels':
        return this.handleListModels();
      case 'getKnowledge':
        return this.handleGetKnowledge();
      case 'putKnowledge':
        return this.handlePutKnowledge(msg.content);
      case 'reindexSymbols':
        return this.handleReindexSymbols();
      case 'listKnowledgeFiles':
        return this.handleListKnowledgeFiles();
      case 'readKnowledgeFile':
        return this.handleReadKnowledgeFile(msg.name);
      case 'writeKnowledgeFile':
        return this.handleWriteKnowledgeFile(msg.name, msg.content);
      case 'deleteKnowledgeFile':
        return this.handleDeleteKnowledgeFile(msg.name);
      case 'listSkills':
        return this.handleListSkills();
      case 'readSkill':
        return this.handleReadSkill(msg.name);
      case 'writeSkill':
        return this.handleWriteSkill(msg.name, msg.content);
      case 'deleteSkill':
        return this.handleDeleteSkill(msg.name);
      case 'getRules':
        return this.handleGetRules();
      case 'putRules':
        return this.handlePutRules(msg.content);
      case 'getPermissions':
        return this.handleGetPermissions();
      case 'putPermissions':
        return this.handlePutPermissions(msg.perms);
      case 'resetPermissions':
        return this.handleResetPermissions();
      case 'revealCwd':
        return this.handleRevealCwd();
      case 'confirmTool':
        if (this.api) await this.api.confirmTool(msg.id, msg.approve, msg.reason);
        return;
      case 'promptInput': {
        const value = await vscode.window.showInputBox({
          title: msg.title,
          placeHolder: msg.placeholder,
          value: msg.value,
          ignoreFocusOut: true,
        });
        this.post({ type: 'promptInput_result', id: msg.id, value });
        return;
      }
      case 'confirmDialog': {
        const pick = await vscode.window.showWarningMessage(msg.message, { modal: true, detail: msg.detail }, '확인');
        this.post({ type: 'confirmDialog_result', id: msg.id, confirmed: pick === '확인' });
        return;
      }
      case 'openExternal':
        await vscode.env.openExternal(vscode.Uri.parse(msg.url));
        return;
    }
  }

  private async handleListKnowledgeFiles() {
    if (!this.api) return;
    try {
      const r = await this.api.listKnowledgeFiles();
      this.post({ type: 'knowledge_files', dir: r.dir, files: r.files });
    } catch (e: any) { this.post({ type: 'status', status: 'error', message: e.message }); }
  }
  private async handleReadKnowledgeFile(name: string) {
    if (!this.api) return;
    try { const r = await this.api.readKnowledgeFile(name); this.post({ type: 'knowledge_file', name, ...r }); }
    catch (e: any) { this.post({ type: 'status', status: 'error', message: e.message }); }
  }
  private async handleWriteKnowledgeFile(name: string, content: string) {
    if (!this.api) return;
    try { await this.api.writeKnowledgeFile(name, content); await this.handleListKnowledgeFiles(); vscode.window.showInformationMessage(`저장됨: ${name}`); }
    catch (e: any) { vscode.window.showErrorMessage(e.message); }
  }
  private async handleDeleteKnowledgeFile(name: string) {
    if (!this.api) return;
    try { await this.api.deleteKnowledgeFile(name); await this.handleListKnowledgeFiles(); }
    catch (e: any) { vscode.window.showErrorMessage(e.message); }
  }

  private async handleListSkills() {
    if (!this.api) return;
    try {
      const r = await this.api.listSkills();
      this.post({ type: 'skills_list', dir: r.dir, skills: r.skills });
    } catch (e: any) { this.post({ type: 'status', status: 'error', message: e.message }); }
  }
  private async handleReadSkill(name: string) {
    if (!this.api) return;
    try { const r = await this.api.readSkill(name); this.post({ type: 'skill_file', name, ...r }); }
    catch (e: any) { this.post({ type: 'status', status: 'error', message: e.message }); }
  }
  private async handleWriteSkill(name: string, content: string) {
    if (!this.api) return;
    try { await this.api.writeSkill(name, content); await this.handleListSkills(); vscode.window.showInformationMessage(`스킬 저장됨: ${name}`); }
    catch (e: any) { vscode.window.showErrorMessage(e.message); }
  }
  private async handleDeleteSkill(name: string) {
    if (!this.api) return;
    try { await this.api.deleteSkill(name); await this.handleListSkills(); }
    catch (e: any) { vscode.window.showErrorMessage(e.message); }
  }

  private async handleGetRules() {
    if (!this.api) return;
    try { const r = await this.api.getRules(); this.post({ type: 'rules', ...r }); }
    catch (e: any) { this.post({ type: 'status', status: 'error', message: e.message }); }
  }
  private async handlePutRules(content: string) {
    if (!this.api) return;
    try { await this.api.putRules(content); vscode.window.showInformationMessage('사용자 지침 저장됨.'); }
    catch (e: any) { vscode.window.showErrorMessage(e.message); }
  }

  private async handleGetPermissions() {
    if (!this.api) return;
    try { const p = await this.api.getPermissions(); this.post({ type: 'permissions', perms: p }); }
    catch (e: any) { this.post({ type: 'status', status: 'error', message: e.message }); }
  }
  private async handlePutPermissions(perms: any) {
    if (!this.api) return;
    try { const p = await this.api.putPermissions(perms); this.post({ type: 'permissions', perms: p }); vscode.window.showInformationMessage('권한 정책 저장됨.'); }
    catch (e: any) { vscode.window.showErrorMessage(e.message); }
  }
  private async handleResetPermissions() {
    if (!this.api) return;
    try { const p = await this.api.resetPermissions(); this.post({ type: 'permissions', perms: p }); vscode.window.showInformationMessage('권한 초기화됨.'); }
    catch (e: any) { vscode.window.showErrorMessage(e.message); }
  }
  private async handleRevealCwd() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      vscode.window.showInformationMessage('열린 워크스페이스가 없습니다.');
      return;
    }
    await vscode.commands.executeCommand('revealFileInOS', folders[0].uri);
  }

  private async handleReady() {
    try {
      const info = await this.server.start();
      this.api = new ApiClient(info.baseUrl);
      const cfg = await this.api.getConfig();
      this.post({ type: 'server_ready', baseUrl: info.baseUrl, config: cfg });
      // load most recent session or create one
      const sessions = this.store.list();
      this.session = sessions[0] || (await this.store.create());
      this.post({ type: 'session', session: this.session });
      this.pushSessionList();
    } catch (e: any) {
      this.post({ type: 'status', status: 'error', message: e.message });
    }
  }

  private async openNewSession() {
    const cfg = vscode.workspace.getConfiguration('hanimoCode');
    const mode = cfg.get<string>('mode') || 'super';
    this.session = await this.store.create(mode);
    this.post({ type: 'session', session: this.session });
    this.pushSessionList();
  }

  private async switchChat(id: string) {
    const s = this.store.get(id);
    if (!s) return;
    this.session = s;
    this.post({ type: 'session', session: s });
  }

  private pushSessionList() {
    this.post({ type: 'session_list', sessions: this.store.list() });
  }

  private async handleSend(prompt: string, modeOverride?: string, mentions?: string[], images?: string[]) {
    if (!this.api || !this.session) {
      this.post({ type: 'status', status: 'error', message: 'server not ready' });
      return;
    }
    if (!prompt.trim()) return;
    this.currentAbort?.abort();
    const ac = new AbortController();
    this.currentAbort = ac;

    // Resolve @-mentioned files (knowledge/skill .md) and prepend their
    // contents to the prompt so the LLM has them this turn only.
    let augmented = prompt;
    if (mentions && mentions.length > 0) {
      const parts: string[] = [];
      for (const m of mentions) {
        try {
          if (m.startsWith('knowledge:')) {
            const r = await this.api.readKnowledgeFile(m.slice('knowledge:'.length));
            parts.push(`<knowledge name="${m}">\n${r.content}\n</knowledge>`);
          } else if (m.startsWith('skill:')) {
            const r = await this.api.readSkill(m.slice('skill:'.length));
            parts.push(`<skill name="${m}">\n${r.content}\n</skill>`);
          }
        } catch {
          // ignore — mention may be stale
        }
      }
      if (parts.length > 0) augmented = parts.join('\n\n') + '\n\n---\n\n' + prompt;
    }

    const session = this.session;
    const mode = modeOverride || session.mode;
    const userTurn: Turn = { kind: 'user', text: prompt, ts: Date.now() };
    session.turns.push(userTurn);
    await this.store.save(session);
    this.post({ type: 'turn_appended', turn: userTurn });
    this.post({ type: 'status', status: 'streaming' });

    let assistantTurn: Turn | null = null;

    try {
      const cfg = vscode.workspace.getConfiguration('hanimoCode');
      const body: any = {
        prompt: augmented,
        mode,
        max_turns: cfg.get<number>('maxTurns') || 20,
        client: 'vscode', // signal to server to add markdown formatting hint
      };
      if (images && images.length > 0) body.images = images;
      for await (const ev of this.api.chat(body, ac.signal)) {
        let data: any;
        try { data = JSON.parse(ev.data); } catch { data = {}; }
        switch (ev.event) {
          case 'content': {
            if (!assistantTurn) {
              assistantTurn = { kind: 'assistant', text: '', ts: Date.now() };
              session.turns.push(assistantTurn);
            }
            (assistantTurn as { text: string }).text += data.text || '';
            this.post({ type: 'content', text: data.text || '' });
            break;
          }
          case 'tool_call': {
            const toolTurn: Turn = {
              kind: 'tool', id: data.id, name: data.name, args: data.arguments, ts: Date.now(),
            };
            session.turns.push(toolTurn);
            this.post({ type: 'tool_call', id: data.id, name: data.name, arguments: data.arguments });
            assistantTurn = null; // next content starts a new assistant turn
            break;
          }
          case 'tool_confirm': {
            this.post({ type: 'tool_confirm', id: data.id, name: data.name, arguments: data.arguments });
            break;
          }
          case 'tool_result': {
            const t = session.turns.find((x) => x.kind === 'tool' && (x as { id: string }).id === data.id) as Turn | undefined;
            if (t && t.kind === 'tool') {
              t.result = data.result; t.aborted = data.aborted === 'true' || data.aborted === true;
            }
            this.post({ type: 'tool_result', id: data.id, result: data.result, aborted: data.aborted });
            break;
          }
          case 'usage':
            this.post({ type: 'usage', ...data });
            break;
          case 'error':
            this.post({ type: 'status', status: 'error', message: data.message });
            break;
          case 'done':
            this.post({ type: 'done' });
            break;
        }
      }
      this.post({ type: 'status', status: 'idle' });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        this.post({ type: 'status', status: 'error', message: e.message });
      } else {
        this.post({ type: 'status', status: 'idle', message: 'cancelled' });
      }
    } finally {
      await this.store.save(session);
      this.pushSessionList();
      this.currentAbort = null;
    }
  }

  private async handleDiff(filePath: string, content: string) {
    // Use the built-in vscode.diff command — no external extension required.
    // Left side = current file on disk, right side = AI proposed content
    // (held in an in-memory untitled doc).
    try {
      const left = vscode.Uri.file(this.resolveAbs(filePath));
      const proposed = await vscode.workspace.openTextDocument({
        content,
        language: this.langFromExt(filePath),
      });
      await vscode.commands.executeCommand('vscode.diff', left, proposed.uri,
        `${path.basename(filePath)} ↔ AI 제안`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Diff 표시 오류: ${e.message}`);
    }
  }

  private resolveAbs(p: string): string {
    if (path.isAbsolute(p)) return p;
    const folders = vscode.workspace.workspaceFolders;
    const root = folders && folders.length > 0 ? folders[0].uri.fsPath : process.cwd();
    return path.join(root, p);
  }

  private langFromExt(p: string): string {
    const ext = path.extname(p).slice(1).toLowerCase();
    const map: Record<string, string> = { ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact', py: 'python', go: 'go', rs: 'rust', md: 'markdown' };
    return map[ext] || ext || 'plaintext';
  }

  private async handleApply(filePath: string, content: string) {
    try {
      const abs = this.resolveAbs(filePath);
      const uri = vscode.Uri.file(abs);
      // Capture pre-apply snapshot so we can show a diff against the
      // post-apply result. If file doesn't exist yet (new file), the
      // snapshot is empty.
      let preContent = '';
      try {
        const doc = await vscode.workspace.openTextDocument(uri);
        preContent = doc.getText();
      } catch { /* new file */ }

      const edit = new vscode.WorkspaceEdit();
      const exists = await this.fileExists(uri);
      if (exists) {
        const doc = await vscode.workspace.openTextDocument(uri);
        const fullRange = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
        edit.replace(uri, fullRange, content);
      } else {
        edit.createFile(uri, { ignoreIfExists: false });
        edit.insert(uri, new vscode.Position(0, 0), content);
      }
      const ok = await vscode.workspace.applyEdit(edit);
      if (!ok) {
        vscode.window.showErrorMessage('적용 실패.');
        return;
      }
      const doc = await vscode.workspace.openTextDocument(uri);
      await doc.save();

      // Show before/after diff in a side editor — non-modal, easy to dismiss.
      const beforeUri = vscode.Uri.parse(`hanimo-before:${encodeURIComponent(abs)}?ts=${Date.now()}`);
      this.beforeContents.set(beforeUri.toString(), preContent);
      await vscode.commands.executeCommand('vscode.diff', beforeUri, uri,
        `${path.basename(filePath)} — 적용 결과`);

      vscode.window.showInformationMessage(`적용됨: ${path.basename(filePath)}`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`적용 오류: ${e.message}`);
    }
  }

  private async fileExists(uri: vscode.Uri): Promise<boolean> {
    try { await vscode.workspace.fs.stat(uri); return true; } catch { return false; }
  }

  /** Cache for hanimo-before:// content provider. Cleared when extension stops. */
  private beforeContents = new Map<string, string>();
  registerContentProvider(context: vscode.ExtensionContext) {
    const provider: vscode.TextDocumentContentProvider = {
      provideTextDocumentContent: (uri) => this.beforeContents.get(uri.toString()) ?? '',
    };
    context.subscriptions.push(
      vscode.workspace.registerTextDocumentContentProvider('hanimo-before', provider),
    );
  }

  private async handleGetConfig() {
    if (!this.api) return;
    const cfg = await this.api.getConfig();
    this.post({ type: 'config', config: cfg });
  }

  private async handlePatchConfig(patch: any) {
    if (!this.api) return;
    try {
      const cfg = await this.api.patchConfig(patch);
      this.post({ type: 'config', config: cfg });
      // Both: in-webview banner (always visible) + VS Code toast (system).
      this.post({ type: 'toast', kind: 'success', message: '✓ 설정 저장됨' });
      vscode.window.showInformationMessage('hanimo 설정 저장됨.');
    } catch (e: any) {
      this.post({ type: 'toast', kind: 'error', message: '저장 실패: ' + e.message });
      this.post({ type: 'status', status: 'error', message: e.message });
    }
  }

  private async handleListModels() {
    if (!this.api) return;
    const models = await this.api.listModels();
    this.post({ type: 'models', models });
  }

  private async handleGetKnowledge() {
    if (!this.api) return;
    try {
      const k = await this.api.getKnowledge();
      this.post({ type: 'knowledge', ...k });
    } catch (e: any) {
      this.post({ type: 'status', status: 'error', message: e.message });
    }
  }

  private async handlePutKnowledge(content: string) {
    if (!this.api) return;
    try {
      await this.api.putKnowledge(content);
      vscode.window.showInformationMessage('지식 파일 저장됨.');
    } catch (e: any) {
      this.post({ type: 'status', status: 'error', message: e.message });
    }
  }

  private async handleReindexSymbols() {
    if (!this.api) return;
    try {
      const idx = await this.api.getSymbols(true);
      this.post({ type: 'symbols', file_count: idx.file_count, symbol_count: idx.symbols.length });
      vscode.window.showInformationMessage(`인덱싱 완료: ${idx.file_count}개 파일, ${idx.symbols.length}개 심볼`);
    } catch (e: any) {
      this.post({ type: 'status', status: 'error', message: e.message });
    }
  }

  private post(msg: any) {
    this.view?.webview.postMessage(msg);
  }

  private renderHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js'),
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.css'),
    );
    const nonce = randomNonce();
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};" />
<link rel="stylesheet" href="${cssUri}" />
</head>
<body>
<div id="root"></div>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function randomNonce(): string {
  let out = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}
