// Singleton wrapper around acquireVsCodeApi(). VS Code only allows it to
// be called once per webview; importing this module everywhere is safe.
declare function acquireVsCodeApi<T = unknown>(): {
  postMessage: (msg: any) => void;
  getState: () => T | undefined;
  setState: (state: T) => void;
};

export const vscode = acquireVsCodeApi();
