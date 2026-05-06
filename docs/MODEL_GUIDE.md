# 모델 선택 가이드

## 추천 우선순위

| 순위 | 모델 | 이유 |
|:---:|---|---|
| 🔥 1 | **Qwen 3.6 35B-A3B** (DeepInfra/Featherless) | SWE-bench 73.4%, Vision + Thinking + 1M ctx |
| ⭐ 2 | **Qwen 3.5 35B-A3B** (Novita) | 3.6 사용 불가 시 대안. SWE-bench 70% |
| 3 | Gemma 4 26B (사내) | 멀티모달 + Reasoning, LCB 77% |
| 4 | Qwen3-Coder-30B (사내) | 도구 호출 정밀, 안정적 |
| 5 | GPT-OSS-120B (사내) | 깊은 추론 전용 |

## 시나리오 매트릭스 (2026-05 기준 벤치마크)

| 작업 | 1순위 | 2순위 | 3순위 |
|---|---|---|---|
| 종합 코딩 | **Qwen 3.6** | Qwen 3.5 | Gemma 4 |
| SWE-bench급 작업 | **Qwen 3.6 (73.4%)** | Qwen 3.5 (70%) | GPT-OSS (62%) |
| 프론트엔드 코드 | **Qwen 3.6 (ELO 1397)** | Gemma 4 | Qwen 3.5 |
| 이미지 첨부 | **Qwen 3.6** | Qwen 3.5 | Gemma 4 |
| Terminal-Bench (CLI 작업) | **Qwen 3.6 (51.5)** | Gemma 4 (42.9) | — |
| 깊은 추론 (architecture) | GPT-OSS-120B | Qwen 3.6 (thinking) | Gemma 4 |
| 거대 레포 (1M ctx) | Qwen 3.6 / 3.5 | Qwen3-Coder | — |
| 사내 환경 (외부망 차단) | Qwen3-Coder | Gemma 4 | GPT-OSS |

## 권장 config 4가지

### A — 최신 외부 모델 (DeepInfra)

```yaml
api:
  base_url: https://api.deepinfra.com/v1/openai
  api_key: <DeepInfra_키>
models:
  super: Qwen/Qwen3.6-35B-A3B
  dev:   Qwen/Qwen3.6-35B-A3B
```

### B — 외부 백업 (Featherless)

```yaml
api:
  base_url: https://api.featherless.ai/v1
  api_key: <Featherless_키>
models:
  super: Qwen/Qwen3.6-35B-A3B
  dev:   Qwen/Qwen3.6-35B-A3B
```

### C — Novita (현재 default)

```yaml
api:
  base_url: https://api.novita.ai/openai
  api_key: <Novita_키>
models:
  super: qwen/qwen3.5-35b-a3b
  dev:   qwen/qwen3.5-35b-a3b
```

### D — 사내 (외부망 차단 환경)

```yaml
api:
  base_url: <사내_엔드포인트>
  api_key: <사내_키>
models:
  super: Qwen3-Coder-30B          # 일상 = 빠름 + 에이전틱
  dev:   gpt-oss-120b             # 깊은 작업
```

또는 단일:

```yaml
models:
  super: google/gemma-4-26b-it    # 만능 (이미지+추론+코드)
  dev:   google/gemma-4-26b-it
```

## 검증된 벤치마크 (Qwen 3.6 vs Gemma 4)

> 출처: HuggingFace 모델 카드 `Qwen/Qwen3.6-35B-A3B`

| | Qwen 3.6 35B-A3B | Gemma 4 26B-A4B | Gemma 4 31B |
|---|:---:|:---:|:---:|
| SWE-bench Verified | **73.4** | 17.4 | 52.0 |
| SWE-bench Pro | **49.5** | 13.8 | 35.7 |
| Terminal-Bench 2.0 | **51.5** | 34.2 | 42.9 |
| QwenWebBench (frontend) | **1397** | 1178 | 1197 |
| LiveCodeBench v6 | 80.4 | 77.1 | 80.0 |
| MMMU (vision) | 81.7 | 78.4 | 80.4 |
| RealWorldQA | **85.3** | 72.2 | 72.3 |

## 알려진 점

### Thinking 모드 기본 ON
Qwen 3.5/3.6 둘 다 `enable_thinking=true` default. `<think>...</think>` 가 응답에 섞여 나옴.

해결법:
- DeepInfra/Featherless: API 호출 시 `chat_template_kwargs.enable_thinking: false`
- Novita: 대시스코프 호환 모드 — `enable_thinking: false`

> 향후 hanimo UI에 thinking 토글 추가 예정. 현재는 응답에 섞여 출력.

### Preserve Thinking (Qwen 3.6 only)
Qwen 3.6 신기능 — 히스토리의 thinking 보존. 에이전틱 시나리오에서 토큰 절약.

`chat_template_kwargs.preserve_thinking: true` 로 활성. 현재 hanimo 미사용 (단발 호출 위주).

### Tool Use Parser
DeepInfra/Featherless에서 직접 호스팅 시 `--tool-call-parser qwen3_coder` 옵션 권장 (도구 호출 인식). 그쪽 서비스가 알아서 켜줌.

## 모델 전환 방법

### UI (VS Code Extension)
설정 → 모델 → Super 드롭다운 → 저장

### config 직접 편집
```bash
$EDITOR ~/.hanimo/config.yaml
```

### TUI 1회만
```bash
hanimo exec --model Qwen/Qwen3.6-35B-A3B "이 코드 리팩토링"
```
