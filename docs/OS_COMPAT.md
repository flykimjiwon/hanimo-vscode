# OS 호환성 가이드

## VS Code 버전 호환

| VS Code | Node | 동작 |
|---|---|:---:|
| 1.49 이하 | — | ❌ WebviewView API 없음 |
| **1.74** ~ 1.80 | 16 | ✅ (`cross-fetch` 폴리필 자동) |
| 1.81+ | 18+ | ✅ (네이티브 fetch) |
| 1.115 (현재 최신) | 22 | ✅ |

폴리필 동작:
- 1.74-1.80: `cross-fetch` 가 글로벌 `fetch` 와 `Response.body` 를 채움. body 는 Node Readable.
- 1.81+: 네이티브 `fetch` + WHATWG ReadableStream.

SSE 클라이언트(`services/sse.ts`) 는 두 형태를 자동 감지 (`getReader()` 있으면 Web stream 방식, 없으면 `for await` Node stream 방식).


## 빌드 매트릭스

| OS | 아키텍처 | 바이너리 이름 | CGO |
|---|---|---|:---:|
| macOS | arm64 (M1+) | `hanimo-server-darwin-arm64` | OFF |
| macOS | x64 (Intel) | `hanimo-server-darwin-x64` | OFF |
| Windows | x64 | `hanimo-server-win32-x64.exe` | OFF |
| Linux | x64 | `hanimo-server-linux-x64` | OFF |

`CGO_ENABLED=0` → 정적 바이너리. libc/glibc 의존 없음. 알파인 리눅스, 구형 macOS 까지 그대로 동작.

## 핵심 설계 원칙

### 경로
- Go 측: 모든 파일 경로는 `filepath.Join` / `filepath.Clean` 만 사용 → Windows `\`, Unix `/` 자동.
- TS 측: `path.join(extensionUri.fsPath, 'bin', name)` → VS Code API 가 OS 추상화.

### 셸
- `internal/tools/shell.go` — Windows에서는 `cmd.exe /c`, Unix에서는 `/bin/sh -c`.
- `internal/tools/terminal_unix.go` vs `terminal_windows.go` — 빌드 태그로 분리.

### 프로세스 라이프사이클
| | 동작 |
|---|---|
| 정상 종료 | HTTP `POST /shutdown` → 100ms grace → `http.Server.Shutdown(ctx)` |
| 강제 종료 | `proc.kill('SIGKILL')` (Unix), `taskkill /T /F /PID` (Windows) |
| VS Code 종료 시 | `deactivate()` → `server.stop()` 자동 호출 |
| 좀비 방지 | 1.5초 grace 후 force-kill |

### 한글/유니코드
- Go: 모든 파일 IO가 UTF-8. CP949 변환 안 함.
- 검증된 한글 경로: `/Users/kimjiwon/Desktop/kimjiwon/hanimo/hanimo/`
- 검증된 한글 파일명: `내문서.md` 읽기/쓰기 OK.

### IME
- Korean/Japanese/Chinese 입력 중 Enter는 IME commit이라 send 트리거 안 함.
- `Composer.tsx`: `e.isComposing || keyCode === 229` 가드.

## 알려진 함정

### macOS Gatekeeper
미서명 .vsix 안의 바이너리를 처음 실행하면:

```
"hanimo-server-darwin-arm64" cannot be opened because the developer cannot be verified.
```

해결책 (사용자):
1. `시스템 설정 → 개인정보 보호 및 보안` 에서 "그래도 허용" 클릭
2. 또는 터미널에서 `xattr -d com.apple.quarantine ~/.vscode/extensions/hanimo.hanimo-vscode-*/bin/hanimo-server-darwin-*`

장기 해결: Apple Developer ID 코드사이닝 ($99/년).

### Windows Defender SmartScreen
미서명 .exe 첫 실행 시 경고. 사용자가 "추가 정보 → 그래도 실행" 클릭해야 함.

장기 해결: EV Code Signing ($300+/년).

### 바이너리 권한 보존
- `.vsix` 는 zip 파일. zip은 Unix 권한 비트 보존.
- `vsce package` 가 chmod 755로 설정한 바이너리를 그대로 패킹.
- VS Code 가 압축 풀 때도 보존됨 — 검증됨.

### 한글 폴더 + Windows
`C:\Users\김지원\...` 같은 경로:
- Go: 정상 동작 (UTF-8).
- Node child_process: 인자로 전달 시 정상.
- 단, 일부 에디터는 cmd.exe 인코딩이 cp949라 stdout 깨질 수 있음 → 우리는 stdout 파싱 시 `'utf-8'` 명시.

### 포트 점유
- `--port 0` → OS 랜덤 포트.
- 충돌 시 listener 에러 즉시 로그.

### 파일 핸들 누수 (Windows)
Windows는 `os.Open` 후 닫지 않으면 파일 잠금. 코드 리뷰 결과 모든 핸들에 `defer f.Close()` 적용됨.

## 테스트 매트릭스

| 항목 | macOS arm64 | macOS x64 | Win10/11 x64 | Linux x64 |
|---|:---:|:---:|:---:|:---:|
| 빌드 | ✅ | ✅ | ✅ | ✅ |
| 설치 (.vsix) | ✅ | (pending hardware) | (pending) | (pending) |
| 채팅 + 도구 호출 | ✅ | (pending) | (pending) | (pending) |
| 한글 경로 | ✅ | (pending) | (pending) | (pending) |
| IME 입력 | ✅ (한글) | (pending) | (pending) | (pending) |

`(pending)` 항목은 해당 OS 머신에서 직접 검증 필요.

## 디버깅 팁

### 서버가 spawn 안 됨
`View → Output → hanimo` 채널 확인.
- `binary not found` → `npm run build:server:current` 안 돌렸음.
- `address in use` → 포트 충돌 (희박, OS가 자동 할당하므로). 재시작.

### VS Code 종료 후 좀비 프로세스
- macOS/Linux: `ps aux | grep hanimo-server`
- Windows: `tasklist | findstr hanimo-server`
- 발견 시: 위에 명시한 force-kill 로직이 동작 안 한 케이스 — 이슈로 보고.
