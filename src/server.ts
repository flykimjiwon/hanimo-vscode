// TgcServer manages the lifecycle of the bundled hanimo-server subprocess.
// One workspace = one server. Bound to localhost only.
import { spawn, ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as vscode from 'vscode';

export interface ServerInfo {
  baseUrl: string;
  pid: number;
}

const ADDR_PATTERN = /listening on (http:\/\/[0-9.]+:\d+)/;

export class TgcServer {
  private proc: ChildProcess | null = null;
  private baseUrl: string | null = null;
  private startPromise: Promise<ServerInfo> | null = null;
  private output: vscode.OutputChannel;

  constructor(
    private readonly extensionUri: vscode.Uri,
    output: vscode.OutputChannel,
  ) {
    this.output = output;
  }

  /** Path to the bundled binary for this OS+arch. */
  private resolveBinaryPath(): string {
    const override = vscode.workspace.getConfiguration('hanimoCode').get<string>('serverPath') || '';
    if (override) {
      return override;
    }
    const platform = process.platform; // 'darwin' | 'win32' | 'linux'
    const arch = process.arch;          // 'arm64' | 'x64'
    const ext = platform === 'win32' ? '.exe' : '';
    const name = `hanimo-server-${platform}-${arch}${ext}`;
    return path.join(this.extensionUri.fsPath, 'bin', name);
  }

  /** Best-effort workspace root. Falls back to home dir when none. */
  private resolveCwd(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      return folders[0].uri.fsPath;
    }
    return os.homedir();
  }

  async start(): Promise<ServerInfo> {
    if (this.startPromise) {
      return this.startPromise;
    }
    this.startPromise = this.startInternal();
    try {
      return await this.startPromise;
    } catch (err) {
      this.startPromise = null;
      throw err;
    }
  }

  private startInternal(): Promise<ServerInfo> {
    return new Promise((resolve, reject) => {
      const binary = this.resolveBinaryPath();
      if (!fs.existsSync(binary)) {
        reject(new Error(
          `hanimo-server binary not found at ${binary}.\n` +
          `Build it via: npm run build:server (from vscode_extension/).`,
        ));
        return;
      }

      const cwd = this.resolveCwd();
      this.output.appendLine(`[server] spawn ${binary} --cwd "${cwd}"`);

      const proc = spawn(binary, ['--host', '127.0.0.1', '--port', '0', '--cwd', cwd], {
        cwd,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        // Windows: detached:false ensures kill propagates; we still tree-kill on exit.
        detached: false,
      });

      this.proc = proc;
      let resolved = false;
      let stdoutBuf = '';

      proc.stdout?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stdoutBuf += text;
        this.output.append(`[server:out] ${text}`);
        if (!resolved) {
          const m = stdoutBuf.match(ADDR_PATTERN);
          if (m) {
            resolved = true;
            this.baseUrl = m[1];
            resolve({ baseUrl: m[1], pid: proc.pid! });
          }
        }
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        this.output.append(`[server:err] ${chunk.toString()}`);
      });

      proc.on('error', (err) => {
        this.output.appendLine(`[server] error: ${err.message}`);
        if (!resolved) reject(err);
      });

      proc.on('exit', (code, signal) => {
        this.output.appendLine(`[server] exit code=${code} signal=${signal}`);
        this.proc = null;
        this.baseUrl = null;
        this.startPromise = null;
        if (!resolved) {
          reject(new Error(`hanimo-server exited before ready (code=${code}, signal=${signal})`));
        }
      });

      // Timeout — if no addr within 10s, give up.
      setTimeout(() => {
        if (!resolved) {
          reject(new Error('hanimo-server did not announce its address within 10s.'));
          this.kill();
        }
      }, 10_000);
    });
  }

  getBaseUrl(): string | null {
    return this.baseUrl;
  }

  async restart(): Promise<ServerInfo> {
    await this.stop();
    return this.start();
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    const proc = this.proc;
    // Try graceful shutdown via HTTP first.
    if (this.baseUrl) {
      try {
        await fetch(`${this.baseUrl}/shutdown`, { method: 'POST' });
      } catch {
        // ignore — fall through to kill
      }
    }
    return new Promise((resolve) => {
      const done = () => resolve();
      if (proc.exitCode !== null) { done(); return; }
      proc.once('exit', done);
      // Force kill after 1.5s. Windows ignores SIGTERM; SIGKILL maps to
      // TerminateProcess. We additionally call taskkill /T /F to clean up
      // any potential children (safe noop if there are none).
      setTimeout(() => this.forceKill().then(done), 1_500);
    });
  }

  private async forceKill(): Promise<void> {
    if (!this.proc) return;
    const pid = this.proc.pid;
    try { this.proc.kill('SIGKILL'); } catch { /* ignore */ }
    if (process.platform === 'win32' && pid) {
      try {
        const { spawnSync } = await import('node:child_process');
        spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
      } catch { /* ignore */ }
    }
  }

  private kill() {
    void this.forceKill();
  }
}
