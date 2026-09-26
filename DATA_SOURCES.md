# 이름 자료 출처와 이용 범위

## 배포 후보 2,119개

- **NVIDIA, [Nemotron-Personas-Korea](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)** — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 2026-09-25에 공개 자료의 9개 Parquet 파일에서 합성 인물의 한글 전체 이름, 성별 필드와 나이만 집계했습니다. 이름 두 글자만 추출해 19~40세 표본의 출현 횟수와 전체 연령 대비 비율을 선별 신호로 사용했습니다. 원문 페르소나 문장은 저장하거나 배포하지 않습니다. 원본은 **합성** 자료로, 각각의 이름 횟수는 실제 등록 건수가 아닙니다. 이 서비스가 한글 이름 추출, 연령 제한, 중복 집계, 제외 목록, 로마자 보조 표기 및 추천 순위를 추가했습니다.
- **대한민국 대법원, [출생신고 이름 통계](https://stfamily.scourt.go.kr/st/StFrrStatcsView.do?pgmId=090000000025)** — 2025-01-01부터 2025-06-08까지 서울 일자별 남녀 조회 318회에서 화면에 공개된 상위 20위 이름을 모았습니다. 두 음절·최소 3건 이름만 후보에 더했습니다. 이 자료는 일부 지역·기간·상위권만 포함하므로 출생신고 총량이나 전국 순위가 아닙니다. [법원 저작권 정책](https://stfamily.scourt.go.kr/sm/SmBottomCopyProtecPolic.do)의 출처표시 자유이용 안내를 참고했습니다.
- **대한민국 대법원, [인명용 한자 조회](https://efamily.scourt.go.kr/cs/CsBltnWrtList.do?bltnbordId=0000010)** — 51개 시범 이름의 글자별 인명용 표시와 지정 독음만 확인했습니다. 전체 이름의 법적 등록 가능성, 영문 번역, 오행 분류, 한자 두 글자를 합친 뜻은 법원의 인증이 아닙니다.
- **국립국어원, [국어의 로마자 표기법](https://www.korean.go.kr/front_eng/roman/roman_01.do)** — 후보의 로마자 기본 표기용 표를 참고했습니다. 복합 받침, 음운 변화, 개인이 쓰는 관용 표기는 별도 검수가 필요합니다.

`scripts/build-name-corpus.py`는 이름별로 축약된 원본 집계 파일을 입력받아 `lib/korean_name_corpus.json`을 재생성합니다. 연구용 축약 파일과 대법원 추출 CSV는 `../output/name_corpus_research`에 보관하며 서비스 빌드에는 포함하지 않습니다. 변경 이력은 Git 커밋으로 추적합니다.

## 원래 영어 이름의 사용 경향

미국 [SSA 출생 이름 자료 설명](https://www.ssa.gov/oact/babynames/background.html)·[국가별 다운로드 안내](https://www.ssa.gov/oact/babynames/limits.html)를 확인했습니다. 이 환경에서 공식 ZIP 다운로드가 HTTP 403을 반환해 [Hadley Wickham의 babynames](https://hadley.github.io/babynames/)가 제공하는 SSA 재배포본을 사용했습니다. 재배포 패키지 라이선스는 CC0입니다. 고정 Git 커밋 `4391c25ea10b8b0589cdbab63067de3bc8b3a628`의 `data/babynames.rda`에서 1950–2017 출생 기록만 집계했으며 최신 2025년 자료라고 표시하지 않습니다.

SSA의 M/F는 신청서에 기록된 sex별 집계입니다. 잘못 기록된 sex가 있을 수 있고, 연간 이름·sex 조합 5회 미만은 공개 표에서 제외됩니다. 미국 출생·특정 기간만 포함하고 문화·나라·시대별 용법이 다를 수 있습니다. 서비스는 이 이름 사용 자료로 추천할 이름의 인상 기본값만 정하며 개인의 성별을 추정·저장하지 않습니다. 원래 이름을 SSA 또는 제3자에게 요청으로 보내지 않고 배포에 포함된 집계 파일에서 대조합니다.

`scripts/build-name-usage.py`로 재생성합니다. 전체 기록·시기별 M/F 합계를 저장한 9,284개 이름을 포함하며 최소 집계 1,000회·전체 한쪽 비율 95%·시기 일관성 검사를 적용합니다. 애매하거나 문화권 차이가 있는 이름은 유보하고 사용자 선택을 우선합니다. 다운로드 경로·원문 해시·조회 시각·실제 기간을 JSON 메타데이터에 기록했습니다. 원문 R 자료·파서 설치는 `../output/name_usage_research`의 연구용 캐시이며 서비스 런타임 의존성이 아닙니다.

## 출생 지역 선택용 IANA 자료 상세

`lib/time-zone-options.json`은 [IANA zone.tab](https://data.iana.org/time-zones/tzdb/zone.tab)의 2026-09-26 조회본에서 국가·구역·설명만 저장합니다. [공개 도메인](https://data.iana.org/time-zones/tzdb/LICENSE) 자료입니다. 국가별 구역 표시를 위한 호환성 표이며 현지 오프셋 계산은 Temporal의 IANA 시간대 규칙을 사용합니다. 모든 도시의 지리 위치·좌표 검색은 구현하지 않았습니다. `scripts/build-zone-options.mjs`로 다시 만들 수 있으며 브라우저가 지원하지 않는 구역은 선택 목록에서 제외됩니다.
