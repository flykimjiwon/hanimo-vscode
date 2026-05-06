# Changelog

## v0.1.0 — 2026-05-06

Initial release. Ported from techai vscode extension and rebuilt for hanimo's
multi-provider engine.

- VS Code sidebar webview (Preact) — chat, history, knowledge, skills, settings, permissions
- Bundled `hanimo-server` (Go binary, ~11 MB per platform)
- Provider presets: Anthropic, OpenAI, Gemini, DeepSeek, Novita, OpenRouter, Ollama, Custom
- 26 tools, 3 modes (Super / Deep Agent / Plan)
- Knowledge: `~/.hanimo/rules.md` + `.hanimo.md` + `.hanimo-knowledge/*.md` auto-prepend
- Skills: `.hanimo-skills/*.md` lazy-loaded on demand
- Permissions: per-tool allow/ask/deny + 12 shell denylist patterns
- One-click Apply for `// path/to/file`-prefixed code blocks
- Multimodal image paste/drop
- Symbol indexer (regex-only, <1s)
- 4 platforms: darwin-arm64, darwin-x64, linux-x64, win32-x64
