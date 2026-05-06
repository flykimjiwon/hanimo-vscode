// VS Code webview API surface used in the bundle.
declare function acquireVsCodeApi<T = unknown>(): {
  postMessage: (msg: any) => void;
  getState: () => T | undefined;
  setState: (state: T) => void;
};
