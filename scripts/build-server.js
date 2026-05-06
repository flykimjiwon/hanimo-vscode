// Cross-compile hanimo-server bundled into the VS Code extension.
//
// hanimo is multi-provider OSS (Anthropic, OpenAI, Gemini, DeepSeek,
// Novita, OpenRouter, Ollama, ...). No onprem/distro variant — users pick
// their endpoint freely from SettingsView. Anyone needing a sealed corporate
// build can fork hanimo-code and pass their own ldflags; this extension
// always ships the vanilla server.
//
// Source layout assumption: hanimo-code lives next to hanimo-vscode as a
// sibling directory. Override with HANIMO_CODE_REPO=/path/to/hanimo-code.
//
// Usage:
//   node scripts/build-server.js              # 4 OS
//   node scripts/build-server.js --current    # current OS only
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const defaultRepo = path.resolve(__dirname, '..', '..', 'hanimo-code');
const repoRoot = process.env.HANIMO_CODE_REPO || defaultRepo;
if (!fs.existsSync(path.join(repoRoot, 'go.mod'))) {
  console.error(`[build] hanimo-code repo not found at ${repoRoot}`);
  console.error(`[build] Set HANIMO_CODE_REPO=/path/to/hanimo-code to override.`);
  process.exit(1);
}

const binDir = path.resolve(__dirname, '..', 'bin');
fs.mkdirSync(binDir, { recursive: true });

const targets = [
  { goos: 'darwin', goarch: 'arm64', ext: '' },
  { goos: 'darwin', goarch: 'amd64', ext: '' },
  { goos: 'windows', goarch: 'amd64', ext: '.exe' },
  { goos: 'linux', goarch: 'amd64', ext: '' },
];

const onlyCurrent = process.argv.includes('--current');
const platformMap = { darwin: 'darwin', win32: 'windows', linux: 'linux' };
const archMap = { x64: 'amd64', arm64: 'arm64' };

const ldflags = ['-s', '-w'];

function build({ goos, goarch, ext }) {
  const tsPlatform = goos === 'windows' ? 'win32' : goos;
  const tsArch = goarch === 'amd64' ? 'x64' : goarch;
  const outName = `hanimo-server-${tsPlatform}-${tsArch}${ext}`;
  const outPath = path.join(binDir, outName);
  console.log(`[build] ${goos}/${goarch} -> ${outName}`);
  execSync(`go build -ldflags "${ldflags.join(' ')}" -o "${outPath}" ./cmd/hanimo-server`, {
    cwd: repoRoot,
    env: { ...process.env, GOOS: goos, GOARCH: goarch, CGO_ENABLED: '0' },
    stdio: 'inherit',
  });
  if (ext === '') fs.chmodSync(outPath, 0o755);
}

const list = onlyCurrent
  ? [{
      goos: platformMap[process.platform],
      goarch: archMap[process.arch],
      ext: process.platform === 'win32' ? '.exe' : '',
    }]
  : targets;

for (const t of list) build(t);
console.log(`\n[build] done. source: ${repoRoot} · output: ${binDir}`);
