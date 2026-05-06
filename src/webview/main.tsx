import { render } from 'preact';
import { App } from './App';
import { initDialogBridge } from './dialog';
import { vscode } from './vscode';

// Expose VS Code-native prompt/confirm. The singleton acquireVsCodeApi
// happens in ./vscode.ts; consumers import { vscode } from there.
initDialogBridge(vscode);

render(<App />, document.getElementById('root')!);
