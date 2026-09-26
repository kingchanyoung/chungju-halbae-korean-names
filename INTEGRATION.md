# 충주할배 한국 이름 서비스 — 개발팀 인계

전체 실행·API·검증·후속 작업의 시작점은 [DEVELOPER_HANDOFF.md](DEVELOPER_HANDOFF.md)입니다. 소스 저장소는 [GitHub](https://github.com/kingchanyoung/chungju-halbae-korean-names)이며 비공개 접근 권한이 필요합니다.

## 현재 상태

독립 영어 웹앱입니다. 충주할배 사이트의 검정·금색 모바일 화면, 할배 초상과 말투를 참고했습니다. 원래 이름과 **양력 출생일(필수)**, 선택적 출생 시각·출생지 시간대, 발음·뜻·선호 분위기를 입력하면 **한국식 이름 5개를 모두 무료**로 보여줍니다. 한글·로마자, 계산된 사주 요약과 불확실성, **본명 소리·개인적 뜻·원하는 느낌·출생일 해석을 구분한 후보별 근거**, 검증된 후보에 한해 한자 조합 한 가지와 글자별 기본 뜻, 음성·복사·선택 기능이 있습니다. 근거가 없는 항목은 일치한다고 표시하지 않습니다. 성은 기본으로 붙이지 않습니다. 자신의 성이나 한국식 성씨를 붙여 보는 기능은 활동명 예시이며 혈통이나 법적 성을 주장하지 않습니다.

lib/saju.ts는 k-saju 0.1.4와 Temporal 0.5.1로 절기 기준 연·월·일·시주를 계산합니다. 출생일만 알면 현지 자정 관법의 일주를 사용하고, 절기 경계가 가능한 날 연·월주는 유보합니다. 시간과 출생지의 IANA 시간대를 함께 주면 당시 UTC 오프셋으로 시주도 계산합니다. 진태양시 경도 보정과 음력 변환은 아직 없습니다. lib/names.ts는 **2,119개** 두 글자 후보에서 원하는 이름 인상, 로마자 기반 근사 발음, 선택적 뜻 주제, 출처별 이름 빈도를 점수화합니다. **개별 한자 글자·독음을 확인한 이름 표기 51개에만** 가능한 연·월·일·시주의 천간 오행과 글자 뜻 이미지의 편집상 연결을 점수화합니다. 따라서 모든 후보에 출생일 영향이 있는 것은 아닙니다. 후보 출처와 한계는 [DATA_SOURCES.md](DATA_SOURCES.md), 상세 규칙은 [NAMING_METHOD.md](NAMING_METHOD.md)에 있습니다. 이는 완성된 전문 성명학 판단이나 생성형 AI 풀이가 아닙니다.

lib/hanja_verified.json의 51개 이름은 2026-09-25 대법원 인명용 한자 조회에서 **개별 글자와 지정 독음**을 확인했습니다. 그 밖의 이름은 한자를 배정하지 않습니다. 전체 이름의 법적 등록 가능성과 한자 오행 분류는 검증된 것이 아닙니다. 영어 뜻은 편집 번역이며 한글 이름마다 가능한 한자 조합이 여러 개일 수 있습니다. 남성적·여성적·중립적 인상은 제한된 법원 자료와 합성 표본의 성별 필드를 활용한 분류로, 개인의 성별이나 이름 사용 자격을 뜻하지 않습니다.

무료 결과는 D1에 저장하며 무작위 결과 ID와 읽기 전용 접근 토큰으로 다시 엽니다. 링크는 7일 유효합니다. **원본 출생일·시각·시간대는 저장하지 않고 사주 요약만 저장**합니다. 원래 이름과 힌트, 다섯 이름은 저장됩니다. 삭제 토큰은 읽기 토큰과 분리하고 생성한 브라우저에 보관합니다. 공유 링크를 받은 사람은 결과를 삭제할 수 없습니다. 베타 피드백은 결과와 분리하여 저장하고 다음 결과 생성 시 30일 초과 항목을 정리합니다. app/api/names/generate와 app/api/names/read가 무료 API입니다. lib/report.ts의 buildReport는 **모든 선택 이름의 무료 개인 보고서**를 만듭니다. 한자 미배정 이름에는 한자 뜻을 만들지 않습니다. /my-report는 읽기 토큰을 URL fragment에서만 읽어 개인 보고서·한국어 소개문·PDF 인쇄를 열고, /sample-report는 가상 예시입니다. 성씨 선택은 기기 로컬 저장이며 공유 링크와 DB에는 저장하지 않습니다. PNG 카드에 본명·생일·사주·힌트·접근 토큰을 넣지 않습니다.

## 이번 고도화

기본 추천은 전체 2,119개 중 법원 표본 3건 이상 또는 합성 청년 표본 100회 이상인 796개를 사용합니다. 합성 빈도는 실제 인기·전문가 검수로 표기하지 않습니다. 혼합 인상 세 종류 포함, 발음·뜻·스타일 강조 우선순위, 이미 본 후보를 제외한 재추천을 구현했습니다. `preferences_json`에 priority와 이용자가 직접 입력한 avoidTerms를 저장합니다. 세션 중 자동으로 모은 재추천 excludeNames와 원본 출생일은 저장하지 않습니다. IANA 국가·지역 목록 검색은 모든 도시 검색이 아니며 현지 구역을 직접 고릅니다. [시장 검토와 출시 과제](MARKET_REVIEW.md)를 참고하세요.

## 팀 배포용 베타와 친구 투표

- 영어 서비스: https://chungju-halbae-korean-names.ysp106.chatgpt.site/
- 팀원 안내: https://chungju-halbae-korean-names.ysp106.chatgpt.site/beta-guide
- `NameDirection`은 any/familiar/timeless/contemporary입니다. 실제 세대별 적합성이나 연령 추정이 아닌 약한 선호 가산점입니다. `preferences_json`에 direction을 저장합니다. classic/modern 레거시 입력은 timeless/contemporary 방향으로 연결하고 API 값은 유지합니다.
- 새 후보에는 direction 근거를 추가합니다. 카드와 보고서에 글자·독음 확인과 전체 이름 전문가 검수 미완료를 구분해 표시합니다. 한자 확인 이름 수는 51개로 유지합니다.
- `POST /api/name-polls`는 sourceId, **원본 생성 브라우저의 deleteToken**, 원본 후보 중 names 2~3개로 별도 poll을 만듭니다. `POST /api/name-polls/read`, `/vote`는 poll id/token만으로 접근하고 원본 id/읽기 토큰/본명/사주/메모를 반환하지 않습니다. 공개 후보 필드는 hangul/romanization/syllables만입니다.
- 투표는 poll별 browserId를 HMAC 처리하고 `(poll_id, voter_key_hash)` 유일 키로 첫 선택만 유지합니다. 신원을 인증한 1인 1표가 아닙니다. 생성 10회/시간, 읽기 180회/시간, 투표 30회/일의 IP 제한을 둡니다.
- `POST /api/name-polls/delete`는 sourceId/deleteToken으로 종료합니다. 결과 하나에 활성 poll은 하나이며 닫은 뒤 재생성이 가능합니다. poll은 원본 만료 시각을 공유하고, 원본 존재와 만료를 read/vote마다 재검사합니다. migration 0006의 FK cascade로 원본 삭제→poll 삭제→votes 삭제를 적용합니다.
- 팀 테스트는 `node scripts/check-polls.mjs URL`로 소유자 권한, 후보 allowlist, 개인정보 부재, 첫 표 재시도, 종료·재생성·원본 삭제를 확인할 수 있습니다. 일반 베타 피드백은 별도의 기존 흐름입니다.

## 원래 이름에 따른 기본 인상

`NameFeel`에 `auto`를 추가해 폼·API·WebMCP 기본값으로 사용합니다. 기존 `any`는 남성·여성·중성 세 종류를 포함하는 명시적 혼합으로 유지합니다. `resolveNameImpression`은 원래 이름 전체 철자의 미국 출생 기록 사용 경향을 대조하며, Jason 같은 명확한 경우 남성향 후보만 사용합니다. 원래 이름의 사용 경향이며 이용자의 성별 판단이 아닙니다. 직접 고른 feminine/masculine/neutral/any는 항상 우선합니다. 집계 자료·기간·보수적 기준은 [DATA_SOURCES.md](DATA_SOURCES.md)와 [NAMING_METHOD.md](NAMING_METHOD.md)에 있습니다.

`preferences_json.impressionBasis`에 자동/명시적 요청, 실제 적용 인상, 참조 기간·출처·집계 근거를 보관합니다. 스키마 변경 없이 read/report에서 복원하고 카드·투표의 공개 필드 목록에는 추가하지 않습니다. 이전 결과의 name_feel any는 혼합으로 남깁니다. API 422 혼합 검사는 요청값 대신 적용 결과가 any인지 확인합니다. `scripts/check-auto-impression.mjs URL`로 기본 Jason/Emma, 애매한 Alex, 수동 feminine/mix, DB 복원을 확인합니다.

## 가격과 결제

| 구간 | 가격 | 제공 |
| --- | --- | --- |
| 무료 공개 베타 | 0원 | 추천 모두, 사주 요약, 로마자·가능한 한국어 음성, 후보별 근거, 확인된 기본 한자, 성씨 미리보기, 실제 개인 보고서·소개문·PDF 인쇄·PNG 카드 |
| 향후 검토 완료 한자 스토리 | 해외 가격안 US$7.99 / 국내 가격안 ₩9,900, 1회 | 무료 내용에 추가할 전문가 사전 검토 완료 한자 결합 해석·개인별 연결과 추가 근거. 아직 판매 승인·결제 없음 |

**결제는 아직 열지 않았습니다.** 첫 방식은 사용자 결정에 따라 무통장입금·운영자 확인으로 준비합니다. [BANK_TRANSFER.md](BANK_TRANSFER.md)에 주문·입금 확인·제공 상태와 필요한 운영 정보를 정리했습니다. 해외 달러와 국내 원화 가격은 별도 가격안이며 실제 수취 계좌 통화에 맞게 확정합니다. 계좌·영문 약관·환불 운영·메일 재열람·검수 상품을 준비한 뒤 청구를 개통합니다.

## gwimunsaju.com 연결

초기 연결은 기존 사이트 영문 메뉴에 독립 서비스 링크를 추가하면 됩니다. 같은 도메인 경로가 필요하면 개발팀이 /en/korean-name 라우팅과 자산/API/보고서/투표 경로를 함께 설정하거나 전체 앱을 이식합니다. 이 앱은 Next.js App Router 호환 구조의 **Vinext + Cloudflare Workers/D1** 서비스이며 일반 Next.js 서버로 옮길 때 런타임·DB 의존성을 바꿔야 합니다. 전체 이식 경로와 배포 준비는 [DEVELOPER_HANDOFF.md](DEVELOPER_HANDOFF.md)에 있습니다. 기존 /admin이나 사주 엔진을 크롤링해 연결하지 않습니다. 결과 ID에 저장된 다섯 이름을 결제와 보고서까지 그대로 사용하세요. 이 제품의 제안 SKU korean_name_report_v1은 기존 30일 이용권과 분리합니다. 원래 이름과 발음 힌트를 관리자 목록이나 분석 이벤트에 노출하지 마세요.

## 보고서 결제 연결 계약

1. 서버가 resultId + accessToken + selectedHangul을 검증합니다. buildReport 성공은 무료 보고서 생성이며 구매 적격성이 아닙니다. 별도 SKU 판매 승인과 이름 조합·영문 풀이·명리 해석의 검수자·날짜·버전 기록을 대조하고 해당 유료 추가 내용이 있는 경우만 주문을 만듭니다. 현재 승인된 유료 SKU는 없습니다.
2. 서버가 지원되는 수취 통화와 가격, SKU, 결과 ID, 선택 이름, 구매자 이메일로 주문 ID를 만듭니다. 브라우저가 보낸 가격은 사용하지 않습니다.
3. 주문번호·금액·수취 통화·입금 기한·은행/예금주/계좌를 안내합니다. 한국 휴대폰은 해외 사용자에게 필수로 요구하지 않습니다. 계좌가 없는 상태에서는 주문과 입금 안내를 발급하지 않습니다.
4. 운영자가 실제 수취 내역의 금액·통화·입금자·시간·주문번호를 대조해 관리자 인증된 경로로 paid 처리합니다. 고객의 입금 완료 클릭·캡처·성공 URL만으로 권한을 열지 않습니다. 중복 승인·중복 제공을 막고 확인자와 시각을 기록합니다.
5. 구매자 이메일 인증 또는 별도 구매 토큰으로 재열람합니다. 구매 권한은 무료 링크 7일 만료와 분리합니다. 환불은 수취·취소 기록을 확인한 담당자가 처리하고 완료 시 유료 접근을 정지합니다.

## 유료 정식 출시 전 필수 작업

- 한국어 작명 검수자가 2,119개 후보의 추천 상위권, 51개 한자 조합의 영문 풀이, 성별·세대별 인상, 성씨 결합을 검토합니다. 명리 전문가는 현재 오행 이미지 연결과 순위 규칙을 별도로 검수해야 합니다.
- [한국천문연구원 월력요항](https://astro.kasi.re.kr/kor/life/post/almanac?search_year=2026)과 입춘·주요 절기, 해외 시간대·DST, 오래된 시간대, 자시 경계를 대조합니다. 도시 검색과 음력·윤달 지원 여부를 결정합니다.
- [기존 약관](https://gwimunsaju.com/terms)과 [개인정보처리방침](https://gwimunsaju.com/privacy)에 별도 상품, 원래 이름·힌트·사주 요약·해외 사용자 데이터 흐름, 환불 규칙을 반영합니다.
- D1의 만료 결과와 오래된 피드백을 정기 삭제하는 작업을 추가합니다. 현재 정리는 다음 결과 생성 시 실행되며 7일은 **링크 유효기간**입니다. 서버 측 생성·피드백·투표 요청 제한은 이미 구현했습니다.
- 결제 전 관리자 주문·환불 상태, 문의 대응, 메일 복구, 사기·중복 결제 점검을 구현합니다.
- WebMCP generate_korean_names 도구는 지원 브라우저에서 정상 입력·오류 입력을 확인합니다.

## 로컬 실행

Node 22.13 이상에서 npm ci, npm run dev, npm run build를 실행합니다. 새 D1 로컬 DB에는 0000부터 0006까지 마이그레이션을 순서대로 적용합니다. 기존 DB에는 아직 적용하지 않은 후속 마이그레이션만 순서대로 적용합니다. 공개 베타 환경에는 `BETA_RATE_SECRET`을 비밀 환경 변수로 설정해야 요청 제한이 작동합니다.

    npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file drizzle/0000_dapper_redwing.sql --yes
    npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file drizzle/0001_clammy_redwing.sql --yes
    npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file drizzle/0002_uneven_blindfold.sql --yes
    npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file drizzle/0003_rare_colleen_wing.sql --yes
    npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file drizzle/0004_fancy_wallop.sql --yes
    npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file drizzle/0005_skinny_whistler.sql --yes
    npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file drizzle/0006_open_black_queen.sql --yes

## 주요 자료

- [이름 품질 검수 기준](NAME_QUALITY_REVIEW.md)
- [지음당 포함 시장 비교](MARKET_REVIEW.md)
- [무통장입금 연결 설계](BANK_TRANSFER.md)
- [이름 자료 출처와 라이선스](DATA_SOURCES.md)
- [대법원 인명용 한자 조회](https://efamily.scourt.go.kr/cs/CsBltnWrtList.do?bltnbordId=0000010)
- [국어의 로마자 표기법](https://korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0004)
- [만세력 라이브러리](https://github.com/bunhine0452/k-saju)
