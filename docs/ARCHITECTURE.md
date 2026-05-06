# Architecture

## 한눈에 보기

```
┌──────────────────────────────────────────────────────────────────┐
│                       VS Code Extension Host                       │
│                                                                    │
│  extension.ts ─────► server.ts ────────► hanimo-server (Go)          │
│       │                  │                       │                │
│       │                  └─ stdout: announces port                │
│       │                                          │                │
│       └─► chatView.ts ◄─postMessage──── WebView (Preact)          │
│                  │                                                 │
│                  └─► fetch()/SSE ─────► hanimo-server                │
└──────────────────────────────────────────────────────────────────┘
                                                  │
                                                  └─► 외부 LLM (OpenAI-compatible)
```

핵심: **익스텐션은 얇은 IO 레이어. 모든 LLM/도구 로직은 Go 서버에서.**

## 컴포넌트

### 1. `cmd/hanimo-server` (Go)

기존 TUI 엔진(`internal/llm`, `internal/tools`, `internal/hooks`, `internal/config`)을 재사용해 HTTP+SSE 로 노출.

| 파일 | 역할 |
|---|---|
| `main.go` | 부팅, 라우터, 채팅 루프 (SSE 출력) |
| `handlers.go` | `/config`, `/models`, `/index/symbols`, `/knowledge` |
| `symbols.go` | 정규식 기반 심볼 인덱서 (`.hanimo-cache/symbols.json`) |

— `--cwd` 로 워크스페이스 격리, 기본 `127.0.0.1:0` (OS 포트 자동 할당).

### 2. `vscode_extension/` (TS + Preact)

| 폴더 | 역할 |
|---|---|
| `src/extension.ts` | activate/deactivate, 명령 등록 |
| `src/server.ts` | hanimo-server 자식 프로세스 lifecycle |
| `src/chatView.ts` | WebView ↔ Go 서버 IPC |
| `src/services/` | api 클라이언트, SSE 파서 |
| `src/store/` | 채팅 세션 영속화 (globalState) |
| `src/webview/` | Preact UI |

### 3. WebView (Preact)

```
webview/
├── App.tsx                # 라우터/상태
├── components/
│   ├── Header.tsx         # 탭 + 액션
│   ├── EmptyState.tsx     # 빈 상태 + 추천
│   ├── Composer.tsx       # 입력창 + 모드 칩 + 전송
│   ├── BottomBar.tsx      # cwd · model · token
│   ├── Turn.tsx           # 한 턴 (user/assistant/tool) 렌더
│   └── CodeBlock.tsx      # ```블록 + Apply 버튼
├── views/
│   ├── SettingsView.tsx   # API key, base_url, model
│   ├── HistoryView.tsx    # 채팅 기록
│   └── KnowledgeView.tsx  # .hanimo.md 편집
└── styles.css             # 브랜드 + VS Code 테마 변수
```

## 데이터 흐름 — `/chat` 한 번

```
사용자 입력
   ↓ (Composer.send)
postMessage({type:'send', prompt})
   ↓
chatView.handleSend
   ├─ ChatStore.save(user turn)
   ├─ POST /chat (SSE)  ─────► hanimo-server runChat
   │                              ├─ system prompt + .hanimo.md
   │                              ├─ StreamChat(model, messages, toolDefs)
   │                              ├─ for each chunk:
   │                              │     emit('content', text)
   │                              ├─ for each tool call:
   │                              │     emit('tool_call', ...)
   │                              │     execute tool → emit('tool_result', ...)
   │                              └─ emit('done')
   │
   └─ For each SSE event:
        postMessage to WebView
        update ChatStore
   ↓
React state update → re-render
```

## 인덱싱 전략

Continue 비교:

| | Continue | hanimo |
|---|---|---|
| 임베딩 | Voyage/OpenAI 강제 | **없음** |
| 리랭커 | 별도 모델 | **없음** |
| 빌드 시간 | 5~30분 | **<1초** (1만줄 기준) |
| 검색 방식 | 벡터 유사도 | 정규식 + 파일 경로 |
| 의존성 | embed model + sqlite | 없음 |

LLM이 도구 호출(`grep_search`, `glob_search`, `file_read`)을 잘하면 임베딩보다 정확하다는 가정. DeepSeek V4 Flash 기준 도구 정확도가 충분.

`find_symbol` 은 보조 — 사용자가 `@symbol foo` 입력했을 때 즉시 위치를 응답에 prepend.

## 호환성

| 항목 | 방식 |
|---|---|
| OS | Go 크로스컴파일 4종 (`darwin-arm64/x64`, `win32-x64`, `linux-x64`) |
| CGO | **꺼짐** (`CGO_ENABLED=0`) — libc/glibc 의존 0 |
| 프로세스 종료 | HTTP `/shutdown` → 1.5초 후 `SIGKILL` fallback |
| 한글 경로 | Go `os` 패키지가 UTF-8 표준화. 검증됨 |
| IME (한/일/중) | `isComposing` + `keyCode 229` 가드 |

## 보안 모델

- 서버는 **127.0.0.1 only**. LAN/외부 노출 없음.
- 포트는 OS 자동 할당 (`port=0`) — fingerprint 어려움.
- API 키는 `~/.hanimo/config.yaml` (TUI와 공유). UI는 마스킹 표시(`sk_M...y2I`).
- 도구 실행은 `chatMu` 로 직렬화 — race 방지.
