# 충주할배 — 외국인 한국 이름 서비스

해외 영어 사용자를 위한 독립 웹앱입니다. 원래 이름, 양력 생년월일, 선택적 출생 시각, 원하는 뜻과 분위기를 참고해 한국 이름을 추천합니다. 현재는 **모든 추천과 개인 보고서가 무료인 공개 베타**입니다.

- [서비스 체험](https://chungju-halbae-korean-names.ysp106.chatgpt.site/)
- [팀원 테스트 안내](https://chungju-halbae-korean-names.ysp106.chatgpt.site/beta-guide)
- **[개발팀 인수인계서](DEVELOPER_HANDOFF.md)** — 실행, 구조, API, 데이터, 과금, 출시 과제
- [전체 소스 ZIP 다운로드](https://github.com/kingchanyoung/chungju-halbae-korean-names/archive/refs/heads/main.zip)
- [인수인계 MD 원본](https://raw.githubusercontent.com/kingchanyoung/chungju-halbae-korean-names/main/DEVELOPER_HANDOFF.md)
- [팀 전달 문구](DEVELOPMENT_TEAM_MESSAGE.md)

## 빠른 시작

Node.js 22.13 이상이 필요합니다. Vinext/React와 Cloudflare Workers/D1을 사용합니다.

```powershell
git clone https://github.com/kingchanyoung/chungju-halbae-korean-names.git
cd chungju-halbae-korean-names
npm ci
Get-ChildItem drizzle -Filter '*.sql' | Sort-Object Name | ForEach-Object {
  npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file $_.FullName --yes
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($_.Name)" }
}
npm run dev
```

위 마이그레이션 명령은 **새 로컬 DB**용입니다. 기존 DB에는 아직 적용하지 않은 파일만 순서대로 적용하세요. 개발 서버가 출력하는 localhost 주소를 사용합니다. GitHub 저장소는 공개이며 로그인 없이 열람·복제·ZIP 다운로드할 수 있습니다.

## 현재 출시 범위

- 기본 인상은 원래 이름의 사용 경향을 따릅니다. Jason은 남성향, Emma는 여성향, Alex 등 모호한 이름은 혼합이며 직접 선택한 선호가 우선합니다.
- 2,119개 이름 자료 중 기본 추천 풀은 796개입니다. 전체 자료가 실제 인구 통계나 전문가 승인 목록은 아닙니다.
- 51개 이름 표기의 **개별 한자 글자와 독음**을 확인했습니다. 전체 이름 뜻·명리 해석·영어 설명의 전문가 검수는 남아 있습니다.
- 생성형 AI 호출이 없습니다. 추천 1회당 AI 입력·출력 토큰은 0이며 서버·DB 비용은 별도입니다.
- 무통장입금 상품은 설계 단계입니다. 계좌, 주문, 입금 확인, 유료 콘텐츠 제공 기능은 개통하지 않았습니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [DEVELOPER_HANDOFF.md](DEVELOPER_HANDOFF.md) | 인수인계의 시작점, 구현 범위와 후속 작업 |
| [INTEGRATION.md](INTEGRATION.md) | 기존 충주할배 사이트 연결과 결제 계약 |
| [NAMING_METHOD.md](NAMING_METHOD.md) | 점수화·출생일 해석·추천 규칙 |
| [DATA_SOURCES.md](DATA_SOURCES.md) | 자료 기간, 라이선스와 한계 |
| [NAME_QUALITY_REVIEW.md](NAME_QUALITY_REVIEW.md) | 이름·한자·번역 검수 기준 |
| [MARKET_REVIEW.md](MARKET_REVIEW.md) | 해외 서비스·국내 서비스·지음당 비교 |
| [BANK_TRANSFER.md](BANK_TRANSFER.md) | 무통장입금 주문·확인·환불 설계 |
| [TEAM_BETA.md](TEAM_BETA.md) | 팀 테스트 안내 |

비밀키, 운영 DB, 사용자 결과, 로컬 브라우저 프로필은 저장소에 포함하지 않습니다. 배포된 베타의 코드 기준과 검증 기록은 인수인계서를 참고하세요.
