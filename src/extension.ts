// fetch polyfill: VS Code <1.81 ships Node 16, which does not expose a
// global fetch. cross-fetch installs one when missing — it's a no-op on
// newer runtimes (1.81+ / Node 18+).
import 'cross-fetch/polyfill';

import * as vscode from 'vscode';
import { TgcServer } from './server';
import { ChatViewProvider } from './chatView';
import { ChatStore } from './store/chatStore';

let server: TgcServer | null = null;
let provider: ChatViewProvider | null = null;
let output: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  output = vscode.window.createOutputChannel('hanimo');
  context.subscriptions.push(output);

  server = new TgcServer(context.extensionUri, output);
  const store = new ChatStore(context.globalState);
  provider = new ChatViewProvider(context, server, store, output);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewId, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );
  provider.registerContentProvider(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('hanimoCode.newChat', () => provider?.newChat()),
    vscode.commands.registerCommand('hanimoCode.openSettings', () => provider?.openSettings()),
    vscode.commands.registerCommand('hanimoCode.openHistory', () => provider?.openHistory()),
    vscode.commands.registerCommand('hanimoCode.restartServer', async () => {
      try {
        await server?.restart();
        vscode.window.showInformationMessage('hanimo 서버 재시작 완료.');
      } catch (e: any) {
        vscode.window.showErrorMessage(`Restart failed: ${e.message}`);
      }
    }),
    vscode.commands.registerCommand('hanimoCode.sendSelection', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const text = editor.document.getText(editor.selection);
      if (!text) return;
      provider?.injectSelection(editor.document.fileName, text);
    }),
  );
}

export async function deactivate() {
  await server?.stop();
}
