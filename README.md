<div align="center">

<img src="https://raw.githubusercontent.com/flykimjiwon/hanimo-vscode/main/media/hanimo-logo.svg" alt="hanimo" width="128" height="128" />

# hanimo — VS Code Extension

**Multi-provider AI coding assistant.** Anthropic · OpenAI · Gemini · DeepSeek · Novita · OpenRouter · Ollama · Custom.

Powered by [hanimo-code](https://github.com/flykimjiwon/hanimo-code) · 26 tools · 12 themes · 3 modes

[Install](#install-from-vsix) · [Features](#features) · [Architecture](#architecture) · [Build](#build-from-source)

</div>

---

> 📸 _Screenshots & demo GIF coming soon — extension is currently in early access._

## Providers supported

Pick any endpoint in Settings — your API key, your choice:

- **Anthropic** Claude (Sonnet 4 / Haiku 4 / Opus 4)
- **OpenAI** GPT-4o, o1/o3
- **Google** Gemini 2.5 Pro / Flash
- **DeepSeek** V3 / R1
- **Novita** OpenAI-compatible
- **OpenRouter** any model
- **Ollama** local (no key needed)
- **Custom** any OpenAI-compatible endpoint

## Features

- 26+ tools (file_read/write/edit, shell_exec, grep_search, glob_search, apply_patch, git_*, diagnostics, ...)
- 3 modes — Super (auto), Deep Agent (long-running), Plan (plan-first)
- Knowledge layer — `~/.hanimo/rules.md` + `.hanimo.md` + `.hanimo-knowledge/*.md` auto-prepended to system prompt
- Skills — `.hanimo-skills/*.md` Claude Code-style on-demand workflows
- Permission policy — per-tool allow/ask/deny + shell regex blocklist (`~/.hanimo/permissions.yaml`)
- Multimodal — paste images directly into the composer (provider must support vision)
- One-click Apply — code blocks with `// path/to/file` headers can be written into the workspace

## Architecture

```
VS Code Extension (TypeScript + Preact)
        │ HTTP/SSE on 127.0.0.1
        ▼
hanimo-server (Go binary, bundled in .vsix)
        │ uses
        ▼
hanimo-code internal/{llm, tools, knowledge, skills, hooks, ...}
```

The extension spawns a bundled `hanimo-server` per workspace. The server is the same engine the [hanimo](https://github.com/flykimjiwon/hanimo-code) TUI uses — multi-provider LLM client, 26 tools, hooks, knowledge/skills layer.

## Install from .vsix

Until we publish to the VS Code Marketplace, grab a build from
[GitHub Releases](https://github.com/flykimjiwon/hanimo-vscode/releases) and
sideload it:

```bash
# pick the .vsix matching your OS/arch
code --install-extension hanimo-vscode-darwin-arm64.vsix --force
```

Then open the **hanimo** sidebar (activity bar) → Settings → choose your
provider → paste API key → Save → start chatting.

## Build from source

```bash
git clone https://github.com/flykimjiwon/hanimo-vscode
cd hanimo-vscode
npm install
npm run build:server:current   # build hanimo-server for your platform
npm run build                  # bundle extension + webview
npm run package:current        # produce .vsix
```

Requires `hanimo-code` checked out alongside this repo (or set `HANIMO_CODE_REPO=/path/to/hanimo-code`).

## License

Apache-2.0
