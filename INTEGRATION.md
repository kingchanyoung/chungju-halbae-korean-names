# 충주할배 한국 이름 서비스 — 개발팀 인계

## 현재 상태

독립 영어 웹앱입니다. 충주할배 사이트의 검정·금색 모바일 화면, 할배 초상과 말투를 참고했습니다. 원래 이름과 **양력 출생일(필수)**, 선택적 출생 시각·출생지 시간대, 발음·뜻·선호 분위기를 입력하면 **한국식 이름 5개를 모두 무료**로 보여줍니다. 한글·로마자, 계산된 사주 요약과 불확실성, 추천 이유, 가능한 한자 조합 한 가지와 글자별 기본 뜻, 음성·복사·선택 기능이 있습니다. 성은 기본으로 붙이지 않습니다. 자신의 성이나 한국식 성씨를 붙여 보는 기능은 활동명 예시이며 혈통이나 법적 성을 주장하지 않습니다.

lib/saju.ts는 k-saju 0.1.4와 Temporal 0.5.1로 절기 기준 연·월·일·시주를 계산합니다. 출생일만 알면 현지 자정 관법의 일주를 사용하고, 절기 경계가 가능한 날 연·월주는 유보합니다. 시간과 출생지의 IANA 시간대를 함께 주면 당시 UTC 오프셋으로 시주도 계산합니다. 진태양시 경도 보정과 음력 변환은 아직 없습니다. lib/names.ts는 51개 시범 후보에서 원하는 이름 인상, 로마자 철자, 뜻 힌트, 선호 분위기와 일간 오행·일부 한자의 **편집상 이미지 연결**을 점수화합니다. 이는 완성된 전문 성명학 판단이나 AI 생성 풀이가 아닙니다. 상세 규칙과 한계는 [NAMING_METHOD.md](NAMING_METHOD.md)에 있습니다.

lib/hanja_verified.json의 51개 이름은 2026-09-25 대법원 인명용 한자 조회에서 **개별 글자와 지정 독음**을 확인했습니다. 전체 이름의 법적 등록 가능성과 한자 오행 분류는 검증된 것이 아닙니다. 영어 뜻은 편집 번역이며 한글 이름마다 가능한 한자 조합이 여러 개일 수 있습니다. 남성적·여성적·중립적 인상은 편집 분류이며 공식 성별 통계가 아닙니다.

무료 결과는 D1에 저장하며 무작위 결과 ID와 접근 토큰으로 다시 엽니다. 링크는 7일 유효합니다. **원본 출생일·시각·시간대는 저장하지 않고 사주 요약만 저장**합니다. 원래 이름과 힌트, 다섯 이름은 저장됩니다. app/api/names/generate와 app/api/names/read가 무료 API입니다. lib/report.ts의 buildReport는 선택 이름의 한자 근거와 비교, 사주 요약을 묶습니다. /sample-report는 가상 예시입니다.

## 가격과 결제

| 구간 | 가격 | 제공 |
| --- | --- | --- |
| 무료 | 0원 | 이름 5개 모두, 사주 요약, 한글·로마자·음성, 추천 이유, 한자 조합과 기본 뜻, 성씨 미리보기 |
| 선택 이름 상세 보고서 | 해외 예정 US$7.99 / 국내 예정 ₩9,900, 1회 | 다섯 이름 비교, 한자·발음·원래 이름 연결, 출처, 성씨 사용 안내, 인쇄·PDF, 구매 후 재열람 |

**결제는 아직 열지 않았습니다.** 구독과 “5개 중 2개 잠금”은 첫 출시에서 사용하지 않습니다. 해외 달러와 국내 원화 가격은 별도 가격안이지 자동 환산이 아닙니다. 영문 약관·개인정보·환불 문구, 해외 결제 계약, 메일 재열람, 결제·환불 검증이 끝나기 전에는 청구하지 않습니다.

## gwimunsaju.com 연결

초기 연결은 기존 사이트 영문 메뉴에 독립 서비스 링크를 추가하면 됩니다. 같은 도메인 경로가 필요하면 개발팀이 /en/korean-name으로 프록시하거나 이 Next.js 앱의 app/page.tsx, app/sample-report, app/api/names, lib, db, drizzle, 데이터 자산을 이식합니다. 기존 /admin이나 사주 엔진을 크롤링해 연결하지 않습니다. 결과 ID에 저장된 다섯 이름을 결제와 보고서까지 그대로 사용하세요. 이 제품의 SKU korean_name_report_v1은 기존 30일 이용권과 분리합니다. 원래 이름과 발음 힌트를 관리자 목록이나 분석 이벤트에 노출하지 마세요.

## 보고서 결제 연결 계약

1. 서버가 resultId + accessToken + selectedHangul을 검증하고 buildReport 완료 여부를 확인합니다.
2. 서버가 판매 지역의 실제 PG 계약에 맞는 통화와 가격, SKU, 결과 ID, 선택 이름, 구매자 이메일로 주문 ID를 만듭니다. 브라우저가 보낸 가격은 사용하지 않습니다.
3. 카드 결제는 [토스페이먼츠 해외 결제](https://docs.tosspayments.com/guides/v2/learn/foreign-payment)의 해외 발행 카드·달러 청구 계약 조건을 확인한 뒤 시작합니다.
4. 성공 URL만으로 보고서를 열지 않습니다. 서버가 paymentKey/orderId/amount를 대조해 [결제 승인 API](https://docs.tosspayments.com/guides/v2/payment-widget/integration)를 호출하고 DONE 상태·금액·통화를 확인한 뒤 권한을 발급합니다. 중복 승인과 웹훅은 멱등 처리합니다.
5. 구매자 이메일의 인증 링크로 재열람하고 인쇄·PDF를 제공합니다. 환불 시 권한을 정지하고 [취소 API](https://docs.tosspayments.com/guides/v2/cancel-payment)를 호출합니다.

## 공개 전 필수 작업

- 한국어 작명 검수자가 51개 이름, 한자·영어 풀이, 성별·세대별 인상, 성씨 결합을 검토하고 후보 목록을 확장합니다. 명리 전문가는 현재 오행 이미지 연결과 순위 규칙을 별도로 검수해야 합니다.
- [한국천문연구원 월력요항](https://astro.kasi.re.kr/kor/life/post/almanac?search_year=2026)과 입춘·주요 절기, 해외 시간대·DST, 오래된 시간대, 자시 경계를 대조합니다. 도시 검색과 음력·윤달 지원 여부를 결정합니다.
- [기존 약관](https://gwimunsaju.com/terms)과 [개인정보처리방침](https://gwimunsaju.com/privacy)에 별도 상품, 원래 이름·힌트·사주 요약·해외 사용자 데이터 흐름, 환불 규칙을 반영합니다.
- D1의 만료 결과를 정기 삭제하고 서버 측 생성 속도 제한을 둡니다. 현재 7일은 **링크 유효기간**이며 자동 삭제 보증은 아닙니다.
- 결제 전 관리자 주문·환불 상태, 문의 대응, 메일 복구, 사기·중복 결제 점검을 구현합니다.
- WebMCP generate_korean_names 도구는 지원 브라우저에서 정상 입력·오류 입력을 확인합니다.

## 로컬 실행

Node 22.13 이상에서 npm install, npm run dev, npm run build를 실행합니다. D1 로컬 DB에는 기존 0000 마이그레이션을 먼저 적용하고 새 0001을 적용합니다. 이미 0000을 적용한 DB에는 0001만 적용합니다.

    npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file drizzle/0000_dapper_redwing.sql --yes
    npx wrangler d1 execute site-creator-d1 --local --config wrangler.local.json --persist-to .wrangler/state --file drizzle/0001_clammy_redwing.sql --yes

## 주요 자료

- [이름 품질 검수 기준](NAME_QUALITY_REVIEW.md)
- [대법원 인명용 한자 조회](https://efamily.scourt.go.kr/cs/CsBltnWrtList.do?bltnbordId=0000010)
- [국어의 로마자 표기법](https://korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0004)
- [만세력 라이브러리](https://github.com/bunhine0452/k-saju)
