# Server API Reference

Base URL: `http://127.0.0.1:<port>` (자식 프로세스가 spawn 시 stdout으로 통보)

```
hanimo-server listening on http://127.0.0.1:54321
                                          ^^^^^ 
                                          parse this
```

## 헬스 / 메타

### `GET /health`
```json
{ "status": "ok", "version": "dev", "cwd": "/Users/.../proj", "model": "deepseek/deepseek-v4-flash" }
```

### `GET /version`
```json
{ "version": "dev" }
```

### `POST /shutdown`
204 No Content. 100ms 후 graceful 종료.

## 설정

### `GET /config`
```json
{
  "base_url": "https://api.novita.ai/openai",
  "api_key": "sk_M…y2I",      // masked
  "super": "deepseek/deepseek-v4-flash",
  "dev":   "deepseek/deepseek-v4-flash",
  "has_key": true,
  "brand_tag": "hanimo"
}
```

### `PATCH /config`
Body — 보낼 필드만:
```json
{ "api_key": "sk_xxx", "super": "deepseek/deepseek-v4-pro" }
```
응답: `GET /config` 와 동일한 형식.

### `GET /models`
```json
{ "models": [
  { "id": "deepseek/deepseek-v4-flash", "display_name": "DeepSeek V4 Flash", "description": "..." }
]}
```

## 채팅 (SSE)

### `POST /chat`
```json
{
  "prompt": "이 함수 리팩토링해줘",
  "mode": "super",          // "super" | "dev" | "plan"
  "max_turns": 20,           // optional
  "stdin": "...",            // optional pipe content
  "model": "..."             // optional override
}
```

응답: `text/event-stream`

| event | data 예시 | 설명 |
|---|---|---|
| `content` | `{"text":"안녕"}` | 어시스턴트 텍스트 델타 |
| `tool_call` | `{"id":"...","name":"file_read","arguments":"{\"path\":\"...\"}"}` | 도구 호출 시작 |
| `tool_result` | `{"id":"...","result":"..."}` | 도구 결과 (실패 시 `aborted:"true"`) |
| `usage` | `{"prompt_tokens":2562,"completion_tokens":54,"total_tokens":2616}` | 토큰 카운트 |
| `turn_end` | `{"turn":0}` | 도구 호출 없이 턴 끝남 |
| `error` | `{"message":"..."}` | LLM/도구 에러 |
| `done` | `{}` | 스트림 종료 (성공/실패 무관) |

직렬화: `chatMu` mutex로 한 워크스페이스에 한 번에 한 채팅.

## 인덱싱

### `GET /index/symbols`
캐시 사용 (5분). `?force=1` 강제 재빌드.

```json
{
  "built_at": "2026-05-06T09:24:00Z",
  "root": "/Users/.../proj",
  "file_count": 198,
  "symbols": [
    { "name": "HomePage", "kind": "function", "file": "src/views/HomePage.tsx", "line": 12 },
    { "name": "ApiClient", "kind": "class", "file": "src/services/api.ts", "line": 25 }
  ]
}
```

### `POST /index/symbols`
강제 재빌드.

지원 언어: `.go`, `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.rs`. 패턴 추가는 `cmd/hanimo-server/symbols.go` 의 `langPatterns`.

## 지식

### `GET /knowledge`
```json
{ "path": "/Users/.../.hanimo.md", "content": "..." }
```

### `PUT /knowledge`
```json
{ "content": "# 프로젝트 지식\n..." }
```

`.hanimo.md` 는 매 채팅 system prompt 에 자동 prepend.

## curl 예시

```bash
PORT=54321  # parse from spawn output

# health
curl -s http://127.0.0.1:$PORT/health

# config
curl -s http://127.0.0.1:$PORT/config

# update model
curl -s -X PATCH http://127.0.0.1:$PORT/config \
  -H 'Content-Type: application/json' \
  -d '{"super":"deepseek/deepseek-v4-pro"}'

# chat (SSE)
curl -N -X POST http://127.0.0.1:$PORT/chat \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"hello","mode":"super","max_turns":2}'
```
