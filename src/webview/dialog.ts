// Webview-side helpers for VS Code native input/confirm dialogs.
// VS Code disables window.prompt/confirm/alert inside webviews, so we
// round-trip through the extension host via postMessage and let it call
// vscode.window.showInputBox / showWarningMessage with `modal: true`.

let counter = 0;
const pendingPrompts = new Map<number, (v: string | undefined) => void>();
const pendingConfirms = new Map<number, (v: boolean) => void>();

let bridge: { prompt: (title: string, placeholder?: string, value?: string) => Promise<string | undefined>; confirm: (message: string, detail?: string) => Promise<boolean> } | null = null;

export function initDialogBridge(vscode: { postMessage: (m: any) => void }) {
  window.addEventListener('message', (ev) => {
    const m = ev.data;
    if (m.type === 'promptInput_result') {
      const r = pendingPrompts.get(m.id);
      if (r) { r(m.value); pendingPrompts.delete(m.id); }
    } else if (m.type === 'confirmDialog_result') {
      const r = pendingConfirms.get(m.id);
      if (r) { r(!!m.confirmed); pendingConfirms.delete(m.id); }
    }
  });

  bridge = {
    prompt(title: string, placeholder?: string, value?: string): Promise<string | undefined> {
      const id = ++counter;
      return new Promise((resolve) => {
        pendingPrompts.set(id, resolve);
        vscode.postMessage({ type: 'promptInput', id, title, placeholder, value });
      });
    },
    confirm(message: string, detail?: string): Promise<boolean> {
      const id = ++counter;
      return new Promise((resolve) => {
        pendingConfirms.set(id, resolve);
        vscode.postMessage({ type: 'confirmDialog', id, message, detail });
      });
    },
  };
  return bridge;
}

/** Components import this directly. Falls back to a noop-resolving promise
 *  if called before initDialogBridge — which shouldn't happen since main.tsx
 *  initializes synchronously. */
export const ui = {
  prompt: (title: string, placeholder?: string, value?: string) =>
    bridge ? bridge.prompt(title, placeholder, value) : Promise.resolve(undefined),
  confirm: (message: string, detail?: string) =>
    bridge ? bridge.confirm(message, detail) : Promise.resolve(false),
};
