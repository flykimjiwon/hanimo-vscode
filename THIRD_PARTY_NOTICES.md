# Third-Party Notices

이 파일은 hanimo-vscode가 의존하는 서드파티 오픈소스의 라이선스 고지입니다.
hanimo-vscode 자체는 Apache-2.0이며 저작권자는 Kim Jiwon (김지원)입니다.

정확한 전이 의존성은 `npx license-checker --production`로 재추출할 수 있습니다.

---

## Runtime Dependencies (확장에 번들됨)

| Package | Version | License |
|---|---|---|
| preact | ^10.22.0 | MIT |
| cross-fetch | ^4.1.0 | MIT |

## Build / Dev Dependencies (배포 .vsix에 코드로 미포함)

| Package | License |
|---|---|
| esbuild | MIT |
| typescript | Apache-2.0 |
| @vscode/vsce | MIT |
| @resvg/resvg-js | MPL-2.0 |
| @types/node | MIT |
| @types/vscode | MIT |

## Bundled Binary

hanimo-vscode는 같은 저작자(Kim Jiwon)의 **hanimo-code**에서 빌드한 `hanimo-server`
바이너리(Go)를 HTTP/SSE로 구동합니다. 해당 바이너리의 서드파티 고지는
[hanimo-code/THIRD_PARTY_NOTICES.md](https://github.com/flykimjiwon/hanimo-code/blob/main/THIRD_PARTY_NOTICES.md)를
참조하세요.

---

전체 라이선스 원문은 각 프로젝트 저장소를 참조하세요. 본 고지에 오류가 있으면
이슈로 알려주시면 정정합니다.
