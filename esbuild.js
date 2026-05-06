// esbuild build script for the extension + webview bundles.
// - extension: CommonJS, targets Node (VS Code's extension host).
// - webview: IIFE, targets browser; loaded inside a WebView.
const esbuild = require('esbuild');
const path = require('path');

const watch = process.argv.includes('--watch');

const extensionConfig = {
  entryPoints: [path.join(__dirname, 'src/extension.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: path.join(__dirname, 'dist/extension.js'),
  external: ['vscode'],
  sourcemap: true,
  logLevel: 'info',
};

const webviewConfig = {
  entryPoints: [path.join(__dirname, 'src/webview/main.tsx')],
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  outfile: path.join(__dirname, 'dist/webview.js'),
  jsx: 'automatic',
  jsxImportSource: 'preact',
  sourcemap: true,
  logLevel: 'info',
};

const stylesConfig = {
  entryPoints: [path.join(__dirname, 'src/webview/styles.css')],
  bundle: true,
  outfile: path.join(__dirname, 'dist/webview.css'),
  loader: { '.css': 'css' },
  logLevel: 'info',
};

(async () => {
  if (watch) {
    const ctx1 = await esbuild.context(extensionConfig);
    const ctx2 = await esbuild.context(webviewConfig);
    const ctx3 = await esbuild.context(stylesConfig);
    await Promise.all([ctx1.watch(), ctx2.watch(), ctx3.watch()]);
    console.log('watching...');
  } else {
    await Promise.all([
      esbuild.build(extensionConfig),
      esbuild.build(webviewConfig),
      esbuild.build(stylesConfig),
    ]);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
