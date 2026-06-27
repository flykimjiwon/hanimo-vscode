# hanimo-vscode Public Packaging Audit

작성 기준: 2026-06-26 KST
대상: `hanimo/hanimo-vscode`
목표: `hanimo-code`의 IDE surface로 공개 설명 가능한지 감사

## 결론

`hanimo-vscode`는 `hanimo-code`의 VS Code surface로 설명 가능하다. README의 first-run flow, settings view, chat/sidebar 구조, bundled server build 흐름은 공개 패키징의 뼈대가 있다.

하지만 Marketplace 공개 전에는 public-safe 문서 정리가 필요하다. 특히 `docs/USAGE.md`, `docs/MODEL_GUIDE.md`, `docs/UI_REFERENCE.md`에는 onprem/과거 브랜드/내부 모델명/내부 키 예시/검증 전 성능성 표현이 섞여 있어 그대로 공개 전면에 두면 안 된다.

## 공식 자료 기준 포지셔닝

공식 자료에서 확인한 방향:

- OpenAI Codex IDE는 IDE에서 cloud task를 위임하고, 결과를 local로 apply하는 흐름을 제공한다.
- GitHub Copilot coding agent는 GitHub issue/PR loop와 branch 기반 작업을 강조한다.
- Cursor Cloud Agents는 editor, web, mobile, Slack, GitHub/Bitbucket에서 background agent를 시작하고 별도 branch로 handoff한다.
- Google Antigravity는 Agent Manager, Editor, Terminal, Browser, Artifacts를 한 surface로 묶는다.

따라서 `hanimo-vscode`의 public positioning은 다음이 적절하다.

> hanimo-vscode is the IDE surface for hanimo-code: a local-first coding agent inside VS Code, with chat, tools, skills, permissions, and project context. Cloud/background/PR workflows are roadmap items rather than current claims.

## Verification

실행한 명령:

```bash
cd /Users/jiwonkim/Desktop/kimjiwon/hanimo/hanimo-vscode
npm run build
```

첫 실행 결과:

- `node_modules`가 없어 `esbuild` module을 찾지 못해 실패

이후 실행:

```bash
npm ci
npm run build
```

결과:

- `npm ci` 성공
- `npm run build` 성공
- `dist/webview.css`, `dist/webview.js`, `dist/extension.js` 생성
- `dist/`와 `node_modules/`는 git ignore 대상
- build 후 작업트리 clean 유지

추가 확인:

```bash
npm audit --audit-level=moderate
```

결과:

- audit 실패
- 8개 취약점 보고: moderate 5, high 3
- 즉시 강제 업그레이드하면 breaking change 가능성이 있어 release gate로 분리해야 함

## README / Marketplace Readiness

| 항목 | 판정 | 메모 |
|---|---|---|
| 제품명 | Ready | `hanimo - VS Code Extension` |
| 역할 설명 | Ready | `hanimo-code` 기반 IDE extension으로 설명 가능 |
| 설치 경로 | Partial | VSIX 설치 중심. Marketplace 공개 절차 문서 필요 |
| First-run flow | Ready | sidebar 열기, Settings, provider/API key, Save, chat 흐름이 있음 |
| Screenshot/GIF | Missing | Marketplace에는 최소 2-3개 screenshot 필요 |
| Marketplace copy | Needs work | description, tags, categories, gallery banner, privacy note 보강 필요 |
| License | Check needed | repo 전체 license와 bundled server license 표기를 맞춰야 함 |
| Security note | Needs work | local-first, key storage, network behavior, command execution boundary를 짧게 명시 |

추천 Marketplace 설명:

> hanimo brings a local-first AI coding agent into VS Code. Chat with your workspace, run tool-assisted edits, manage skills and permissions, and use the bundled hanimo-code server without leaving the IDE.

추천 public keywords:

- `ai`
- `coding-agent`
- `local-first`
- `developer-tools`
- `llm`
- `mcp`
- `skills`

## Public-Safe Audit

### 즉시 정리 필요

| 위치 | 문제 | 조치 |
|---|---|---|
| `docs/USAGE.md` | onprem/내부 배포/내부 모델·키 예시 표현 | public guide와 private deployment guide 분리 |
| `docs/MODEL_GUIDE.md` | 내부 모델명과 검증 전 수치성 표현 | public provider-neutral guide로 재작성 |
| `docs/UI_REFERENCE.md` | 설정 화면에 내부 endpoint/onprem 설명 잔재 | neutral endpoint 설명으로 수정 |
| `CHANGELOG.md` | 과거 브랜드 포팅 문장 | "initial public hanimo VS Code extension" 중심으로 정리 |
| `src/services/api.ts` | `is_onprem` field | public-neutral 이름으로 migration 후보 |
| `src/webview/App.tsx` | `onLoadTechaiMd`, `onSaveTechaiMd` props | `ProjectMd` 또는 `WorkspaceGuide` 계열로 rename |
| `src/webview/views/KnowledgeView.tsx` | 과거 브랜드 prop 이름 | public-neutral rename |

주의: 위 문서에는 내부 모델명, 내부 endpoint, private deployment 흐름이 포함될 수 있으므로 공개 문서에서 원문을 인용하지 않는다.

### 보존 가능한 것

- sealed build 개념은 "enterprise/private fork" 수준으로 추상화하면 공개 가능
- user-defined endpoint는 public local-first 제품에 적합
- bundled server 흐름은 공개 제품의 설치 장벽을 낮추는 장점

## First-Run Flow 감사

현재 흐름:

1. Extension sidebar 열기
2. Settings 진입
3. provider 선택
4. API key 입력
5. 저장
6. chat 시작

좋은 점:

- API key가 없을 때 settings로 유도하는 흐름이 있음
- empty state와 settings view가 분리되어 있음
- user-defined endpoint와 sealed build UI가 이미 고려되어 있음

보강할 점:

- 첫 실행에서 "local model only"와 "API provider"를 명확히 나누기
- API key 저장 위치와 보안 경계를 짧게 설명
- server binary가 없거나 실행 실패할 때 `hanimo-code` 설치/재시도 버튼 제공
- workspace trust 상태와 command execution boundary 표시

## MCP / Tools / Skills UX

현재 관찰:

- skills view 존재
- permissions view 존재
- knowledge/rules/project context view 존재
- backend API는 tools/skills/permissions/knowledge 계열을 가진다
- dedicated MCP server configuration UI는 아직 명확하지 않다

필요한 UX:

| Surface | 현재 | Gap |
|---|---|---|
| Tools | agent 내부 기능으로 존재 | 어떤 tool이 enabled인지 사용자에게 보여주는 panel |
| Skills | skills view 존재 | install/update/source trust 표시 |
| MCP | 명시 config UI 부족 | server list, status, auth, enable/disable, error log |
| Permissions | permissions view 존재 | risky command approval history와 rollback 연결 |
| Knowledge | knowledge view 존재 | workspace guide, AGENTS.md, project rules와의 관계 설명 |

## Checkpoint / Rollback / Agent Task Panel Gap

현재 extension은 chat/apply 중심이다. 공개 경쟁 제품과 비교하면 다음 gap이 크다.

| Gap | 설명 | 우선순위 |
|---|---|---|
| Agent task panel | 진행 중인 agent 작업, 상태, branch/diff/test 결과를 한 눈에 보기 | P0 for public polish |
| Checkpoint timeline | edit 전후 snapshot, apply 단위, undo 가능 지점 표시 | P0 |
| Rollback button | 특정 checkpoint로 되돌리는 UI | P1 |
| Background task | IDE에서 작업을 맡기고 나중에 결과 확인 | P1/P2 |
| Worktree/branch isolation | 현재 checkout을 건드리지 않고 agent 실행 | P1/P2 |
| PR handoff | local branch/diff를 PR로 넘기는 흐름 | P2 |

## Build/Release Packaging

현재 `package.json`에는 다음 script가 있다.

- `build`
- `build:server`
- `build:server:current`
- `package`
- `package:all`
- `package:current`
- `vscode:prepublish`

`.github/workflows/release.yml`은 extension packaging 흐름이 비교적 명확하다.

Release 전 확인할 것:

- [ ] `npm ci`
- [ ] `npm run build`
- [ ] `npm run package:current`
- [ ] generated VSIX 설치 테스트
- [ ] bundled server가 `hanimo-code` clean public branch 기준으로 빌드되는지 확인
- [ ] `npm audit` 결과 triage
- [ ] Marketplace privacy/security copy 작성
- [ ] screenshot/GIF 준비

## Public Launch Checklist

### P0

- [ ] `docs/USAGE.md` public-safe rewrite
- [ ] `docs/MODEL_GUIDE.md` public-safe rewrite 또는 private 문서로 이동
- [ ] `docs/UI_REFERENCE.md` 내부/onprem 표현 제거
- [ ] 코드 식별자에서 과거 브랜드 prop 이름 제거
- [ ] `is_onprem` public-neutral migration 계획
- [ ] Marketplace copy 작성
- [ ] screenshot 2-3개 추가
- [ ] `npm audit` triage
- [ ] VSIX install smoke test

### P1

- [ ] MCP config panel
- [ ] Agent task panel
- [ ] checkpoint timeline
- [ ] rollback UI
- [ ] server binary missing/error recovery flow

### P2

- [ ] background task delegation
- [ ] worktree/branch isolation
- [ ] PR handoff
- [ ] Universe command center deep link

## 최종 판정

`hanimo-vscode`는 `hanimo-code`의 IDE surface로 공개 설명 가능하다. 다만 현재 공개 risk는 코드보다 문서와 packaging copy에 있다. Marketplace로 가기 전에는 내부/onprem 잔재 문서를 먼저 정리하고, 첫 실행과 MCP/skills/permissions UX를 "local-first IDE agent" 흐름으로 압축해야 한다.
