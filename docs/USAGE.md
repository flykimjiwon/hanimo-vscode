# 사용 가이드

## 두 가지 변형 — 어느 걸 받을지

| 변형 | 파일명 | 용도 |
|---|---|---|
| 🛡 **Onprem** | `hanimo-onprem-<OS>.vsix` | **사내 동료 배포용** |
| 🧪 Vanilla | `hanimo-vscode-<OS>.vsix` | 외부망 / 본인 테스트용 |

> Marketplace 미발행. .vsix 파일 직접 배포만 지원.

### Onprem 변형 (대다수)

자동 적용:
- Base URL: `https://api.anthropic.com/v1` (변경 불가)
- 기본 모델: `Qwen3.6-35B`
- Config 위치: `~/.hanimo-onprem/config.yaml` (TUI default 와 분리)
- 모델 드롭다운: 사내 3종만 (Qwen3.6-35B / Qwen3-Coder-30B / GPT-OSS-120B)

사용자는 API 키 (`tg-...`) 1줄만 입력.

### Vanilla 변형 (자유 설정)

- Base URL / API Key / 모델 자유 입력
- 모델 드롭다운: 전체 + 직접 입력
- Config 위치: `~/.hanimo/config.yaml` (TUI default 와 공유)

## 설치

```bash
# CLI
code --install-extension hanimo-onprem-darwin-arm64.vsix --force

# GUI: VS Code → Extensions → ... → "Install from VSIX..."
```

다운로드: https://github.com/flykimjiwon/HANIMO_CODE/releases/tag/vscode-v0.1.0

## 첫 실행

### Onprem 사용자 (일반 사내 동료)
1. 액티비티 바 ✦ 아이콘 → "hanimo" 패널
2. CHAT 탭에 "⚠ API 키 미설정" 노란 배너 → 클릭 (또는 ⚙ 설정)
3. **API Key** 칸에 `tg-...` 입력 (사내 AI Platform 에서 발급)
4. 저장 → 녹색 toast "✓ 설정 저장됨"
5. CHAT 탭으로 돌아가서 바로 사용

### Vanilla 사용자 (외부망 / 본인)
1. 액티비티 바 ✦ → ⚙ 설정
2. **Base URL** 입력 — 예시:
   - 로컬 Ollama: `http://localhost:11434/v1`
   - Novita: `https://api.novita.ai/openai`
   - DeepInfra: `https://api.deepinfra.com/v1/openai`
3. **API Key** 입력
4. **모델** — 콤보박스에서 선택 또는 직접 입력
5. 저장 → 사용

## 기본 사용

### 채팅
- 입력창에 질문 입력 → Enter (Shift+Enter 줄바꿈).
- AI가 도구 호출(`file_read`, `grep_search` 등) 하면 사이드에 표시.
- 코드 응답에 `// path/to/file.ts` 같은 첫 줄 주석이 있으면 **적용** 버튼이 자동으로 떠서 클릭 한 번으로 워크스페이스에 적용 가능.

### 모드
입력창 좌측 하단의 모드 칩:
- **Super** — 범용. 코드/대화 자동 판단. (기본)
- **Deep Agent** — 자율 코딩. 길게 도구 호출 반복.
- **Plan** — 먼저 계획 세움.

### 빠른 시작 추천
빈 화면의 칩 ("이 프로젝트 구조 분석해줘") 클릭 → 입력창에 자동 채워짐.

## 컨텍스트 시스템

hanimo는 4계층의 컨텍스트를 시스템 프롬프트에 자동으로 주입합니다.

### 1. 사용자 지침 — `~/.hanimo/rules.md`
- **모든 프로젝트의 모든 채팅** 에 자동 prepend.
- 설정 → "사용자 지침" 섹션에서 편집.
- 예시:
  ```markdown
  - 한국어로 응답
  - TypeScript 우선
  - 주석은 최소화 (왜 필요한지 비명백할 때만)
  - 테스트 코드도 같이 작성
  ```

### 2. 프로젝트 지식 — `.hanimo.md`
- 워크스페이스 루트의 단일 파일.
- 해당 프로젝트의 모든 채팅에 자동 prepend.
- KNOWLEDGE 탭 → ".hanimo.md (프로젝트)" 에서 편집.

### 3. 지식 폴더 — `.hanimo-knowledge/*.md`
- 워크스페이스 루트의 폴더.
- 안의 모든 활성 .md 파일이 자동 prepend.
- KNOWLEDGE 탭 → "지식 폴더" 에서 새 파일 생성/편집/삭제.
- 비활성화: 파일명을 `_` 로 시작 (예: `_draft.md`).
- 사용 예: API 명세, 도메인 용어, 회사 컨벤션, ERD 다이어그램 (텍스트 형식).

### 4. 스킬 — `.hanimo-skills/*.md`
- on-demand 워크플로우. **본문은 안 prepend** — 인덱스만 시스템 프롬프트에 노출.
- AI가 필요할 때 `file_read` 로 본문 로드.
- SKILLS 탭에서 새 스킬 생성.
- 템플릿:
  ```markdown
  ---
  name: code-review
  description: PR 코드 리뷰 체크리스트
  ---

  ## When to use
  - 사용자가 "리뷰", "체크", "검토" 라고 요청할 때

  ## How to apply
  1. 변경된 파일 모두 읽기
  2. 컨벤션, 보안, 성능 순으로 점검
  3. 결과를 마크다운 체크리스트로 응답

  ## Examples
  - "이 PR 리뷰해줘" → 모든 diff 읽고 체크리스트 응답
  ```

## @ 멘션 — 한 번만 참조

채팅 입력 중 `@` 또는 `+` 아이콘 클릭 → 드롭다운:
- **지식 파일** — `.hanimo-knowledge/` 의 .md 파일
- **스킬** — `.hanimo-skills/` 의 .md 파일

선택하면 입력창 위에 칩(`@kb/api-spec.md`)이 떠요. 전송 시 해당 파일 본문이 이번 메시지에만 prepend.

## 채팅 기록

- 자동 저장 — VS Code globalState (PC 전체 공유).
- HISTORY 탭에서 이전 채팅 클릭하면 그대로 이어서.
- 우측 휴지통으로 삭제.
- 새 채팅: 헤더의 ➕ 버튼.

## 인덱싱 (옵션)

설정 → "인덱싱" → "지금 다시 인덱싱" 버튼.

- 정규식 기반 — 함수, 클래스, 상수 이름만 추출.
- 임베딩 없음. 1만줄 프로젝트 ~1초.
- 캐시: `.hanimo-cache/symbols.json` (5분 유효).
- 지원: `.go`, `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.rs`.

## 우클릭 메뉴

에디터에서 코드 선택 → 우클릭 → **hanimo: 선택 영역 전송**
- 입력창에 `@file <path>` + 코드블록이 자동 삽입.

## 명령 팔레트 (`Cmd+Shift+P`)

| 명령 | 동작 |
|---|---|
| `hanimo: 새 채팅` | 새 세션 시작 |
| `hanimo: 채팅 기록` | HISTORY 탭으로 이동 |
| `hanimo: 설정` | SETTINGS 탭으로 이동 |
| `hanimo: 서버 재시작` | 백엔드 Go 서버 재시작 |
| `hanimo: 선택 영역 전송` | 우클릭과 동일 |

## 자주 묻는 질문

**Q. Continue 와 같이 써도 되나요?**
A. 네, 충돌 없습니다. 사이드바 익스텐션이라.

**Q. 다른 LLM 제공자 (OpenAI, Anthropic) 도 됩니까?**
A. OpenAI-compatible API 라면 `base_url` 만 바꾸면 됩니다. Anthropic 네이티브는 미지원.

**Q. 오프라인에서 됩니까?**
A. 로컬 LLM (Ollama 등) base_url 로 가능. `http://localhost:11434/v1` 같은 식.

**Q. 비용이 얼마나 나오나요?**
A. DeepSeek V4 Flash 기준 — 하루 종일 빡세게 써도 100~500원 (Novita 가격).

**Q. 인덱싱 안 해도 코드 검색되나요?**
A. AI가 `grep_search`/`glob_search` 도구를 직접 호출합니다. 인덱싱은 보조.

**Q. 한글 파일명/폴더명 잘 되나요?**
A. 검증됨. `/Users/김지원/내 폴더/` 같은 경로도 OK.
