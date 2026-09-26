# 충주할배 외국인 작명 서비스 — 개발팀 인수인계

작성일: **2026-09-26**

대상: 기존 충주할배 개발팀 / 해외 영어 사용자용 서비스 담당자

## 1. 저장소와 현재 배포

| 항목 | 주소 / 기준 |
| --- | --- |
| GitHub | https://github.com/kingchanyoung/chungju-halbae-korean-names |
| 인수인계서 | https://github.com/kingchanyoung/chungju-halbae-korean-names/blob/main/DEVELOPER_HANDOFF.md |
| 공개 베타 | https://chungju-halbae-korean-names.ysp106.chatgpt.site/ |
| 팀원 테스트 안내 | https://chungju-halbae-korean-names.ysp106.chatgpt.site/beta-guide |
| 무료·유료 준비 상태 | https://chungju-halbae-korean-names.ysp106.chatgpt.site/plans |
| 개인정보 안내 | https://chungju-halbae-korean-names.ysp106.chatgpt.site/beta-privacy |
| 배포된 코드 | `84e956adf39823c2b59594f1b5046015c1deab44` / Sites 배포 version 17 |
| 추천 알고리즘 | `original-name-usage-beta-13` |

GitHub는 **비공개**이며 `main`이 인수인계 기준 브랜치입니다. 배포 코드 이후의 인수인계 문서 커밋은 실행 로직을 바꾸지 않습니다. 최신 소스 커밋은 `git log -1`로 확인합니다.

이 앱은 독립적으로 만든 서비스입니다. 기존 `gwimunsaju.com/admin`의 서버 코드·DB·결제 계정을 확보하거나 이식한 상태는 아닙니다. 지음당은 공개 페이지를 비교했으며 비공개 작명 엔진을 재사용하지 않았습니다.

## 2. 제품 결정과 구현 상태

콘셉트는 **충주할배가 원래 이름·출생일·뜻·느낌을 참고해 한국 이름을 봐주는 서비스**입니다. 검정·금색 모바일 화면과 할배 이미지를 사용하며 첫 고객은 해외 거주 영어 사용자입니다.

| 항목 | 현재 상태 |
| --- | --- |
| 입력 | 원래 이름 + 양력 생년월일 필수, 출생 시각·시간대·발음 힌트·뜻/이야기·분위기 선택 |
| 오래된 출생일 입력 | 연·월·일 직접 입력 가능, 달력만 거슬러 올라갈 필요 없음 |
| 성별 인상 | 기본 `auto`: 원래 이름의 사용 경향 반영. 수동 남성향/여성향/중성/혼합이 항상 우선 |
| 추천 | 제출 후 5개를 모두 무료 제공. 시작 화면에 추천 결과나 후보 수를 미리 노출하지 않음 |
| 개인화 | 발음/뜻/스타일 강조, familiar/timeless/contemporary 방향, 이름·음절 제외, 세션 재추천 |
| 뜻풀이 | 확인된 한자 글자의 기본 뜻만 제공. 한자를 배정하지 않은 이름에 한자 뜻을 만들지 않음 |
| 성 | 기본은 이름만. 본인 성 또는 한국식 성 미리보기는 활동명 예시이며 혈통·법적 성 변경을 의미하지 않음 |
| 무료 결과 | 이름 근거, 제한된 사주 요약, 로마자, 기기 지원 시 한국어 음성, 복사·선택 |
| 무료 보고서 | 실제 선택 이름의 개인 보고서, 한국어 소개문, 브라우저 인쇄/PDF, PNG 이름 카드 |
| 친구 투표 | 후보 2~3개만 담은 별도 공유 링크, 첫 표 유지, 집계와 종료 가능 |
| 공유·삭제 | 결과 링크 7일 유효, 읽기 토큰과 소유자 삭제 토큰 분리 |
| 피드백 | 별점·선택 이름·짧은 의견 저장. 운영자 검수 화면은 미구현 |
| 결제 | **설계만 완료**. 무통장입금 예정, 계좌/주문/입금 확인/유료 제공 미구현 |
| 전문 검수 | 개별 한자 글자·독음 확인만 완료. 전체 이름·한자 결합 뜻·명리·영어 전문가 승인 미완료 |
| 기존 사이트 연결 | 외부 링크/프록시/이식 방안 정리. 실제 충주할배 메뉴 연결은 개발팀 작업 |

현재 결과는 설명 가능한 규칙 기반 베타입니다. 전문 성명학 검수 완료 상품, 실제 인기 순위, 법적 작명 인증으로 안내하지 않습니다.

## 3. 추천 로직

### 3.1 자료 규모와 기본 후보

- 두 글자 한글 이름 자료 **2,119개**: `lib/korean_name_corpus.json`.
- 기본 추천 풀 **796개**: 제한된 법원 표본 3건 이상 또는 합성 청년 표본 사용 100회 이상.
- 주 자료는 NVIDIA Nemotron-Personas-Korea **합성 표본**입니다. 빈도를 실제 한국 인구의 이름 인기라고 표현하지 않습니다.
- 법원 보조 자료는 **2025년 서울, 1월 1일~6월 8일의 일별 상위 20개** 표본입니다. 전국·모든 연령 통계가 아닙니다.
- 한자 표기 **51개**: 2026-09-25 대법원 조회로 **개별 글자와 지정 독음** 확인. 조합 전체 의미·법적 등록·한자 오행이 모두 검증된 것은 아닙니다.
- 자료 출처·재배포 조건은 [DATA_SOURCES.md](DATA_SOURCES.md)에 있습니다. 자산을 복사할 때 출처와 라이선스 고지를 유지합니다.

### 3.2 원래 이름에 따른 인상 — 최신 수정

`lib/original-name-impression.ts`가 `nameFeel` 기본값 `auto`를 처리합니다.

1. 이용자가 `masculine/feminine/neutral/any`를 직접 선택하면 그 선택을 사용합니다.
2. 자동일 때 **입력한 이름 전체 철자**를 미국 출생 이름 집계와 대조합니다. 임의로 첫 단어를 이름으로 추정하거나 별명을 확장하지 않습니다.
3. 총 기록 1,000건 이상, 우세 비율 95% 이상, 3개 기간 중 기록 100건 이상인 각 기간에서 우세 비율 80% 이상이면 남성향 또는 여성향을 적용합니다.
4. Alex·Taylor·Jordan 등 공유되거나 문화권별 사용이 다른 이름은 보수적 보류 목록으로 혼합을 유지합니다. 미등록·비라틴 이름도 혼합이 기본입니다.
5. 확실한 남성향/여성향은 해당 분류 안에서만 추천합니다. 명시적 혼합 `any`는 남성·여성·중성 세 분류를 포함합니다.

참조 파일 `lib/original-name-usage.json`에는 **9,284개 철자**의 집계가 있습니다. U.S. SSA 기반, Hadley Wickham `babynames` CC0 재배포의 **1950–2017년** 자료를 사용했습니다. 최신 미국 통계나 전 세계 이름 사전은 아닙니다. 이용자 이름을 외부 SSA API로 전송하지 않습니다. 이는 이름 사용 경향이며 이용자의 성별 정체성을 판단하는 값이 아닙니다.

적용 근거 `impressionBasis`는 `preferences_json`에 결과 시점의 스냅샷으로 저장합니다. 기존 저장 결과는 재계산하지 않습니다. 이전 혼합 결과를 수정된 기본값으로 보려면 새로 추천받아야 합니다.

최신 배포에서 확인한 예시: Jason → 주원·지성·찬영·창현·도윤 / Emma → 서현·윤아·채원·지안·예림. 테스트 입력은 `1995-03-16`, `gentle`이며 실제 결과는 다른 선호에 따라 달라집니다.

### 3.3 점수화와 출생일

- 적용 인상으로 후보를 좁히고 근사 로마자 발음, 뜻 주제, 분위기, 출처별 빈도, 이름 방향을 점수화합니다.
- 뜻 입력은 **8개 인식 주제와 부정 표현 규칙**을 사용합니다. 자유 문장 전체를 이해하는 생성형 AI가 아닙니다.
- 기본 결과는 첫 음절 중복을 줄이고 같은 끝 음절이 과도하게 반복되지 않게 구성합니다. 제외 조건이 너무 강해 유효한 5개를 만들지 못하면 `422`를 반환합니다.
- `k-saju 0.1.4` + Temporal로 양력 현지일과 절기를 사용합니다. 입력 범위는 1901년부터 현재까지입니다.
- 시간이 없으면 시주를 사용하지 않습니다. 절기 경계일의 불확실한 연·월주는 유보합니다.
- 시간과 IANA 시간대를 함께 입력하면 당시 UTC 오프셋/DST를 반영합니다. 국가·지역 시간대 검색은 모든 도시의 좌표 검색이 아닙니다.
- 한자 뜻 이미지와 계산 가능한 천간의 편집상 연결은 **한자 확인 표기 51개에만** 적용합니다. 모든 후보에 생일 영향이 있다고 표시하지 않습니다.
- 진태양시 경도 보정, 음력·윤달 변환, 전문 용신·보완 오행 판정은 없습니다. 천문 역법 경계와 명리 연결의 전문가 대조는 후속 과제입니다.

정확한 계산·점수 규칙은 [NAMING_METHOD.md](NAMING_METHOD.md)를 참고하세요. 무작위 생성이나 매번 LLM 호출로 이름을 만들지 않습니다.

## 4. 개발 환경과 실행

### 스택

- Node.js **22.13 이상**, npm, `package-lock.json` 기준 설치.
- Vinext **1.0.0-beta.5**, React **19.2.6**, Vite **8.0.13**.
- Next.js App Router와 호환되는 앱 구조, Cloudflare Workers 런타임, D1 SQLite, Drizzle 마이그레이션.
- `cloudflare:workers`의 `env.DB`를 직접 사용하므로 일반 Next.js 서버로 그대로 옮겨서는 실행되지 않습니다.
- `.openai/hosting.json`은 현재 Sites 프로젝트와 DB 바인딩의 메타데이터입니다. 비밀키는 없습니다. 다른 운영 계정으로 옮길 때에는 새 배포 프로젝트와 리소스를 설정합니다.

### 새 로컬 DB에서 시작 — PowerShell

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

마이그레이션은 `0000`부터 `0006`까지 총 7개를 순서대로 적용합니다. 위 전체 적용은 새 DB용이며 기존 DB에는 미적용분만 실행하세요. 적용한 과거 SQL과 `drizzle/meta` 이력은 수정하지 않습니다.

**로컬 저장 경로는 `.wrangler/state`입니다.** `--persist-to .wrangler/state/v3`로 바꾸면 개발 서버와 다른 중첩 DB를 만들 수 있습니다. `wrangler.local.json`의 placeholder ID는 로컬용이며 운영 D1 ID가 아닙니다.

개발 서버가 출력하는 localhost 주소를 사용하세요. 테스트 명령에는 그 실제 주소를 명시합니다. localhost/127.0.0.1에는 로컬 요청 제한 예외가 있으므로 개발용 비밀키 없이 실행 가능합니다.

### 운영 바인딩과 비용

| 항목 | 요구사항 |
| --- | --- |
| `DB` | 모든 마이그레이션을 적용한 D1 바인딩 |
| `BETA_RATE_SECRET` | 충분히 긴 무작위 값. 호스팅 비밀 환경 변수에만 등록. 요청 제한·투표 HMAC에 사용 |
| R2 | 현재 사용하지 않음 |
| OpenAI 키 | 현재 필요 없음 |

현재 추천 1회당 **AI 입력/출력 토큰 0**입니다. Worker 요청·연산, D1 읽기/쓰기, 저장·트래픽 비용은 별도입니다. 향후 AI 설명을 붙이면 별도의 모델·한도·비용 검토가 필요합니다.

운영 `BETA_RATE_SECRET`을 새로 발급하거나 이전할 때 값은 별도 비밀 관리 경로로 전달합니다. GitHub, MD, 클라이언트 번들에 넣지 않습니다. 프록시 이식 시 IP 제한의 신뢰할 수 있는 IP 전달 경로도 확인하세요.

## 5. 코드 지도

| 경로 | 역할 |
| --- | --- |
| `app/page.tsx` | 영어 폼, 추천 결과, 기본 인상, 재추천, 성 선택, 카드, 피드백 |
| `lib/names.ts` | 입력 검증, 후보 점수·필터·다양성, 결과 타입 |
| `lib/original-name-impression.ts` | 본명 사용 경향 → 기본 이름 인상 |
| `lib/saju.ts` | 출생일·시간대·절기 계산과 불확실성 |
| `lib/name-direction.ts` | familiar/timeless/contemporary 선호 |
| `lib/result-store.ts` | 결과 저장·열람·삭제, 만료 자료 정리 |
| `lib/report.ts`, `app/my-report/*` | 실제 선택 이름의 무료 보고서 |
| `lib/name-card.ts`, `lib/pronounce.ts` | PNG 카드, 기기 한국어 음성 |
| `lib/poll-store.ts`, `lib/poll-types.ts` | 투표 저장, 공개 필드 제한 |
| `components/name-poll-builder.tsx`, `app/name-vote/*` | 투표 만들기·투표 화면 |
| `lib/beta-guard.ts` | 요청 크기·IP 제한·브라우저 투표 HMAC |
| `db/schema.ts`, `drizzle/*` | D1 테이블, 변경 이력 |
| `app/plans`, `app/beta-guide`, `app/beta-privacy` | 무료·유료 상태, 팀 안내, 개인정보 |
| `scripts/build-*.py`, `scripts/build-zone-options.mjs` | 자료 재생성용 도구, 런타임에는 불필요 |
| `public/halbae.jpg`, `public/og.png`, `public/favicon.png` | 브랜드 자산 |

배포 시 필요한 페이지는 `/`, `/my-report`, `/name-vote`, `/sample-report`, `/plans`, `/beta-guide`, `/beta-privacy`와 모든 `app/api` 경로입니다. 홈 화면과 추천 API만 복사하면 보고서·투표·삭제 흐름이 끊깁니다.

## 6. API 계약

모든 API는 **POST JSON**입니다. 읽기 요청에도 토큰을 URL 쿼리로 보내지 않습니다. 반환 객체의 상세 타입은 `lib/names.ts`와 `lib/poll-types.ts`를 기준으로 합니다.

| 경로 | 요청 | 성공 |
| --- | --- | --- |
| `/api/names/generate` | 아래 입력 예시 | `200 {result, token, deleteToken}` |
| `/api/names/read` | `{id, token}` | `200 {result}` |
| `/api/names/delete` | `{id, deleteToken}` | `204` |
| `/api/beta-feedback` | `{rating: 1..5, selectedName?, comment?}` | `200 {ok: true}` |
| `/api/name-polls` | `{sourceId, deleteToken, names: [원본 후보 2~3개]}` | `200 {id, token, expiresAt}` |
| `/api/name-polls/read` | `{id, token, browserId?}` | `200 {poll}` |
| `/api/name-polls/vote` | `{id, token, browserId, selectedName}` | `200 {poll}` |
| `/api/name-polls/delete` | `{sourceId, deleteToken}` | `204` |

```json
{
  "name": "Jason",
  "birthDate": "1995-03-16",
  "style": "gentle",
  "nameFeel": "auto",
  "priority": "balanced",
  "direction": "any",
  "meaningHint": "kindness and a calm life",
  "avoidTerms": [],
  "excludeNames": []
}
```

- UI의 연·월·일 입력은 API 호출 때 `birthDate: YYYY-MM-DD`로 합칩니다.
- 선택적 `birthTime: HH:mm`과 `birthZone: IANA`는 함께 보내야 합니다.
- `style`: `any/gentle/bright/distinctive/classic/modern`. 마지막 두 값은 기존 입력 호환용입니다.
- `nameFeel`: `auto/any/masculine/feminine/neutral`; 생략 시 `auto`.
- `priority`: `balanced/sound/meaning/style`.
- `direction`: `any/familiar/timeless/contemporary`.
- 원래 이름 최대 80자, 발음 힌트 100자, 뜻 힌트 500자. 비라틴 이름은 로마자 발음 힌트가 필요합니다.
- `excludeNames`: 이전 후보 두 글자 한글 이름 최대 30개. `avoidTerms`: 최대 10개, 한글 1~2음절 또는 로마자 최대 20자.
- 피드백 의견 최대 500자. 투표 `browserId`는 브라우저에서 생성한 UUID입니다.
- 주요 오류: `400` 입력, `413` 과대 요청, `422` 후보 부족, `429` 제한, `503` DB/보호 환경 불가, `404` 만료·권한 불일치. 이미 활성 투표가 있으면 `409`입니다.

무료 결과를 그대로 보관하고 보고서·투표에 사용합니다. 선택 후 다시 작명해 결과를 바꾸지 않습니다. 유료 기능을 추가해도 클라이언트가 가격·승인 상태·콘텐츠 버전을 확정하지 않게 구현하세요.

## 7. 데이터·공유·보관

### 저장되는 것

- `name_results`: 원래 이름, 발음/뜻 힌트, 선호, 추천 결과, 사주 **요약**, 알고리즘 버전, 생성/만료 시각, 토큰 해시.
- `preferences_json`: priority, 직접 입력한 avoidTerms, direction, impressionBasis.
- **원본 생년월일·시각·시간대는 결과 DB에 저장하지 않습니다.** 세션 재추천용 excludeNames도 저장하지 않습니다.
- 성씨 선택과 삭제 소유권 키는 브라우저 로컬에 둡니다. 성씨는 결과 DB·공유 링크에 저장하지 않습니다.
- `beta_feedback`: 별점, 선택 한글 이름, 의견, 시각. 결과와 별도로 보관합니다.
- `name_polls`, `name_poll_votes`: 원본 연결, 별도 접근 토큰 해시, 후보, 브라우저 투표 HMAC, 선택, 시각.
- `beta_rate_limits`: 원본 IP가 아닌 목적·시간 구간별 HMAC 키와 횟수·만료 시각.

### 유지해야 할 접근 규칙

- 결과 읽기 토큰과 소유자 삭제 토큰은 별도입니다. 읽기 링크 소지자는 삭제·투표 생성·종료 권한이 없습니다.
- 읽기 링크 토큰은 URL **fragment**에 둡니다. 요청 본문·토큰·본명·힌트를 접근 로그나 분석 이벤트에 수집하지 않습니다.
- 결과/투표 링크는 7일 유효합니다. 현재 만료 DB 정리는 **다음 결과 생성 때** 실행하며 정기 cron 삭제는 아직 없습니다. 링크 만료와 정해진 시각의 실제 삭제를 구분하세요.
- 피드백 30일 초과 정리도 다음 결과 생성 때 실행합니다.
- 원본 삭제 시 투표·표가 FK cascade로 삭제됩니다. 투표 read/vote는 원본 존재·만료를 다시 확인합니다.
- 투표 공개 필드는 한글/로마자/음절/표수 등 허용 필드만입니다. 본명·출생 정보·사주·힌트·원본 ID·한자·이름 추천 근거는 공개하지 않습니다.
- PNG 카드에는 본명·생일·사주·힌트·제외 조건·토큰을 넣지 않습니다.
- 투표는 브라우저별 첫 선택을 유지합니다. 인증된 사람의 1인 1표를 보장하지 않습니다.
- 베타 페이지는 `noindex/nofollow`, 공유 페이지는 개인정보가 없는 고정 OG를 사용합니다.

현재 IP 제한: 생성 30회/시간, 피드백 5회/일, 투표 생성 10회/시간, 투표 읽기 180회/시간, 투표 30회/일. 같은 네트워크의 팀 테스트에서는 제한에 걸릴 수 있습니다.

## 8. 무료·유료와 무통장입금

현재 추천 전체, 기본 한자, 보고서, PDF 인쇄, 카드, 투표는 무료입니다. 유료 상품은 무료 결과에 추가하는 검수 완료 한자 스토리로 설계했습니다.

향후 유료안은 **전문가 사전 검수 완료 추가 한자 스토리** 1회 구매이며 국내 **₩9,900**, 해외 **US$7.99**는 가격 제안입니다. 수취 계좌 통화와 운영 조건을 확정하기 전에는 청구하지 않습니다. 현재 승인된 유료 SKU는 없으며 기존 문서의 `korean_name_report_v1`도 제안 식별자입니다.

사용자 결정에 따라 첫 결제 방식은 **무통장입금 + 운영자 확인**으로 준비합니다. PG를 연결한 상태는 아닙니다. [BANK_TRANSFER.md](BANK_TRANSFER.md)에 상세 계약이 있습니다.

개발할 항목:

1. 검수자·날짜·콘텐츠 버전이 있는 유료 상품 승인 데이터.
2. 서버 확정 가격·통화·결과 ID·선택 이름·구매 이메일·요청 멱등키를 가진 주문.
3. 실제 수취 계좌와 은행 정보, 주문번호·입금 기한 안내.
4. 인증된 운영자의 실입금 대조와 확인자·시각 기록. 고객의 완료 클릭·스크린샷만으로 `paid` 처리하지 않음.
5. 중복 승인·제공 방지, 별도 구매 권한·메일 재열람. 무료 링크 7일 만료와 분리.
6. 환불 요청/완료 기록과 접근 종료, 영어 문의·운영시간·정책.

예정 상태: `pending_transfer → paid → delivered`, `expired`, `cancelled`, `refund_requested → refunded`. 테이블·API·관리자 화면은 후속 개발입니다. 한국 휴대폰을 해외 고객에게 필수로 요구하지 않습니다.

## 9. 기존 충주할배 사이트에 붙이는 방법

**첫 연결은 기존 사이트 영문 메뉴에 베타 링크를 추가하는 방식**이 간단합니다. 현재 기존 관리자 권한이나 소스에 의존하지 않습니다.

동일 도메인이 필요하면 개발팀이 `/en/korean-name` 라우팅을 설계합니다. 프록시는 정적 자산, 보고서·투표 경로, 모든 API 경로와 원래 fragment 공유 링크를 함께 처리해야 합니다. 현재 앱에는 해당 경로 prefix 설정이 없으므로 홈 화면만 프록시하지 말고 라우팅/기본 URL을 조정하세요.

소스를 이식한다면 UI뿐 아니라 이름 자료, lib, DB 스키마·마이그레이션, 전체 API와 Worker 런타임 의존성을 옮겨야 합니다. 기존 서버가 Cloudflare가 아니면 `cloudflare:workers`, DB 저장소, HMAC 환경, 배포 설정을 기존 런타임에 맞게 교체합니다.

GitHub 저장소에는 현재 소스와 변경 이력이 포함되어 있습니다. 현재 Sites 베타의 운영 DB·비밀 환경 변수·배포 권한은 Git push로 이전되지 않습니다. 새 운영 배포에서는 새 DB 바인딩과 secret을 설정하고 마이그레이션을 적용합니다. 운영 데이터가 필요하면 별도의 접근 권한과 이전 계획으로 처리합니다.

## 10. 검증 기록과 재검증 명령

최근 실행 로직 배포에서 다음을 통과했습니다.

- `npx tsc --noEmit`
- `npm run build`
- `npx tsx scripts/check-naming.mts`
- 로컬과 공개 베타의 `scripts/check-auto-impression.mjs`: Jason/Emma 기본값, Alex 혼합, 수동 선택 우선, 저장 결과 복원, 소유자 삭제.
- 친구 투표 도입 배포의 `scripts/check-polls.mjs`: 소유자 권한, 공개 필드, 첫 표 유지, 종료·재생성, 원본 삭제 cascade. 최신 인상 수정은 투표 로직을 변경하지 않았습니다.

새 환경의 URL을 넣어 실행하세요. 아래 localhost 포트는 예시이므로 터미널의 실제 주소로 교체합니다.

```powershell
npx tsc --noEmit
npm run build
npx tsx scripts/check-naming.mts
node scripts/check-auto-impression.mjs http://localhost:3000
node scripts/check-polls.mjs http://localhost:3000
node scripts/smoke-beta.mjs http://localhost:3000
```

API 검증 스크립트는 테스트용 결과를 만들고 삭제합니다. `smoke-beta.mjs`는 **테스트 피드백 1건을 남깁니다**. 반복 실행 시 요청 제한과 운영 데이터 영향을 고려하세요.

현재 빌드에 `astronomy-engine`의 default export 관련 경고가 있습니다. 라이브러리 namespace fallback으로 테스트를 통과했지만 경고가 완전히 제거된 상태는 아닙니다.

전문 작명·명리 검수, 영어 원어민 승인, 실제 브라우저별 화면/음성/다운로드 QA 완료를 위 API 검증 결과로 대신하지 않습니다. 이번 인수인계 문서 추가는 실행 코드 변경이 아니므로 기존 배포 검증 기록을 유지합니다.

## 11. 개발팀 후속 작업 우선순위

### 무료 베타 운영

1. 개발팀 GitHub 접근 권한, 운영 담당자, 이슈 등록 채널 결정.
2. 팀이 실제 입력으로 남성향/여성향/중성, 발음, 뜻, 중복, 제외·재추천 품질을 확인하고 피드백 수집.
3. 한국 이름 상위 후보와 한자·영어 풀이 검수. 원래 이름 자료의 문화권 한계도 점검.
4. 개인정보 안내와 문의 담당자를 실제 운영 정책에 맞게 확정하고 정기 삭제 작업 추가.
5. 기존 충주할배 영문 메뉴 연결 및 필요한 배포/운영 권한 인계.

### 유료 개통 전

1. 전체 이름 조합 뜻·영어 문장·명리 연결의 검수 버전 승인.
2. 은행/예금주/수취 통화/입금 확인 담당자/환불 조건 확정.
3. 주문·관리자 입금 승인·유료 제공·재열람·환불 구현.
4. 해외 DST·역사 시간대·절기·자시 경계 대조, 실제 브라우저 QA와 오류/부하 관측.
5. 가격·약관·개인정보·해외 문의 운영을 실제 제공 범위와 일치시킨 뒤 청구 시작.

## 12. 추가 문서

- [INTEGRATION.md](INTEGRATION.md): 기존 사이트 연결, 결제 검증 계약.
- [NAMING_METHOD.md](NAMING_METHOD.md): 사주 계산, 점수와 후보 구성.
- [DATA_SOURCES.md](DATA_SOURCES.md): 출처·기간·라이선스.
- [NAME_QUALITY_REVIEW.md](NAME_QUALITY_REVIEW.md): 검수 대상과 승인 기준.
- [MARKET_REVIEW.md](MARKET_REVIEW.md): 해외·국내·지음당 비교와 반영 내용.
- [BANK_TRANSFER.md](BANK_TRANSFER.md): 입금·주문·환불 설계.
- [TEAM_BETA.md](TEAM_BETA.md): 팀 테스트 방법.
- [DEVELOPMENT_TEAM_MESSAGE.md](DEVELOPMENT_TEAM_MESSAGE.md): 바로 전달할 요약 문구.
