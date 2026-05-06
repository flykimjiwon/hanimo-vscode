# Development

## 사전 준비

- Go 1.26+
- Node 18+ (extension 빌드)
- VS Code 1.85+

## 디렉토리 셋업

```
hanimo/                       # 모노레포 루트
├── cmd/
│   ├── hanimo/                     # 기존 TUI
│   └── hanimo-server/              # 익스텐션용 HTTP+SSE 서버 ✨
├── internal/                    # 공유 엔진 (TUI/익스텐션 양쪽 사용)
│   ├── llm/
│   ├── tools/
│   ├── hooks/
│   └── config/
├── hanimo-ide/                  # 기존 Wails IDE (참고)
├── hanimo-ide-electron/         # 기존 Electron IDE
└── vscode_extension/            # ⭐ 이 디렉토리
    ├── package.json
    ├── tsconfig.json
    ├── esbuild.js
    ├── icon.png
    ├── LICENSE.txt
    ├── README.md
    ├── docs/
    │   ├── ARCHITECTURE.md
    │   ├── DEVELOPMENT.md       (이 파일)
    │   ├── API.md
    │   └── USAGE.md
    ├── scripts/
    │   └── build-server.js      # Go 4-OS 크로스 빌드
    ├── src/
    │   ├── extension.ts
    │   ├── server.ts
    │   ├── chatView.ts
    │   ├── services/
    │   │   ├── api.ts
    │   │   └── sse.ts
    │   ├── store/
    │   │   └── chatStore.ts
    │   └── webview/
    │       ├── main.tsx
    │       ├── App.tsx
    │       ├── state.ts
    │       ├── icons.tsx
    │       ├── styles.css
    │       ├── vscode.d.ts
    │       ├── components/
    │       │   ├── Header.tsx
    │       │   ├── EmptyState.tsx
    │       │   ├── Composer.tsx
    │       │   ├── BottomBar.tsx
    │       │   ├── Turn.tsx
    │       │   └── CodeBlock.tsx
    │       └── views/
    │           ├── SettingsView.tsx
    │           ├── HistoryView.tsx
    │           └── KnowledgeView.tsx
    ├── bin/                     # 생성됨 (.vscodeignore에서 제외하지 않음)
    └── dist/                    # 생성됨
```

## 빌드 명령

```bash
# (한 번만) 의존성 설치
npm install

# Go 서버 — 현재 OS만 (개발 빠른 반복)
npm run build:server:current

# Go 서버 — 4개 OS 전부 (배포용)
npm run build:server

# extension + webview 번들
npm run build

# 와치 모드 (코드 수정 즉시 반영)
npm run watch

# .vsix 패키징
npx vsce package --target darwin-arm64 --out hanimo-vscode-darwin-arm64.vsix
```

## 로컬 디버깅 워크플로우

### A) Extension Host에서 직접 실행 (권장)

1. VS Code에서 `vscode_extension/` 폴더 열기
2. `F5` — Extension Host 새 창이 뜸
3. 액티비티 바 ✦ 아이콘 → 채팅 패널
4. `vscode_extension/src/**` 수정 → `npm run watch` → 새 창에서 `Cmd+R` (Reload Window)

### B) 설치된 .vsix 로 검증

```bash
node esbuild.js
node scripts/build-server.js --current
npx vsce package --target darwin-arm64 --out hanimo-vscode.vsix
code --install-extension hanimo-vscode.vsix --force
```

설치된 익스텐션을 reload 하려면 VS Code 에서 `Cmd+Shift+P → Developer: Reload Window`.

## 흐름 검증 — Output 채널

`View → Output → hanimo` 에서 다음 로그가 나옵니다:

```
[server] spawn /Users/.../hanimo-server-darwin-arm64 --cwd "..."
[server:out] hanimo-server listening on http://127.0.0.1:54321
[server] exit code=0 signal=null    ← 깨끗한 종료
```

## 자주 만나는 함정

| 증상 | 원인 / 해결 |
|---|---|
| `hanimo-server binary not found` | `npm run build:server:current` 안 돌림 |
| 채팅 보내면 `API key not configured` | 설정 화면에서 키 입력 |
| 서버 재시작이 안 됨 | `Cmd+Shift+P → hanimo: 서버 재시작` |
| 한글 마지막 글자가 다음 메시지로 새어 나감 | 해결됨 (`isComposing` 가드) |
| Webview가 빈 화면 | DevTools 열어서 (`Help → Toggle Developer Tools`) `dist/webview.js` 로드 실패 여부 확인 |

## 새 기능 추가 가이드

### 새 LLM 도구 추가
- `internal/tools/` 에 추가 → 자동으로 TUI/서버 둘 다 사용

### 새 서버 엔드포인트
- `cmd/hanimo-server/handlers.go` 에 핸들러 작성
- `cmd/hanimo-server/main.go` 의 `mux.HandleFunc` 등록
- `vscode_extension/src/services/api.ts` 에 메서드 추가

### 새 UI 뷰
- `src/webview/views/MyView.tsx` 작성
- `src/webview/state.ts` 의 `ViewName` 에 `'my'` 추가
- `src/webview/App.tsx` 의 `renderBody()` 분기 추가
- `src/webview/components/Header.tsx` 의 탭 추가
