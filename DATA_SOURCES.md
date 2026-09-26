# 이름 자료 출처와 이용 범위

## 배포 후보 2,119개

- **NVIDIA, [Nemotron-Personas-Korea](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)** — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). 2026-09-25에 공개 자료의 9개 Parquet 파일에서 합성 인물의 한글 전체 이름, 성별 필드와 나이만 집계했습니다. 이름 두 글자만 추출해 19~40세 표본의 출현 횟수와 전체 연령 대비 비율을 선별 신호로 사용했습니다. 원문 페르소나 문장은 저장하거나 배포하지 않습니다. 원본은 **합성** 자료로, 각각의 이름 횟수는 실제 등록 건수가 아닙니다. 이 서비스가 한글 이름 추출, 연령 제한, 중복 집계, 제외 목록, 로마자 보조 표기 및 추천 순위를 추가했습니다.
- **대한민국 대법원, [출생신고 이름 통계](https://stfamily.scourt.go.kr/st/StFrrStatcsView.do?pgmId=090000000025)** — 2025-01-01부터 2025-06-08까지 서울 일자별 남녀 조회 318회에서 화면에 공개된 상위 20위 이름을 모았습니다. 두 음절·최소 3건 이름만 후보에 더했습니다. 이 자료는 일부 지역·기간·상위권만 포함하므로 출생신고 총량이나 전국 순위가 아닙니다. [법원 저작권 정책](https://stfamily.scourt.go.kr/sm/SmBottomCopyProtecPolic.do)의 출처표시 자유이용 안내를 참고했습니다.
- **대한민국 대법원, [인명용 한자 조회](https://efamily.scourt.go.kr/cs/CsBltnWrtList.do?bltnbordId=0000010)** — 51개 시범 이름의 글자별 인명용 표시와 지정 독음만 확인했습니다. 전체 이름의 법적 등록 가능성, 영문 번역, 오행 분류, 한자 두 글자를 합친 뜻은 법원의 인증이 아닙니다.
- **국립국어원, [국어의 로마자 표기법](https://www.korean.go.kr/front_eng/roman/roman_01.do)** — 후보의 로마자 기본 표기용 표를 참고했습니다. 복합 받침, 음운 변화, 개인이 쓰는 관용 표기는 별도 검수가 필요합니다.

`scripts/build-name-corpus.py`는 이름별로 축약된 원본 집계 파일을 입력받아 `lib/korean_name_corpus.json`을 재생성합니다. 연구용 축약 파일과 대법원 추출 CSV는 `../output/name_corpus_research`에 보관하며 서비스 빌드에는 포함하지 않습니다. 변경 이력은 Git 커밋으로 추적합니다.

## 출생 지역 선택용 IANA 자료

`lib/time-zone-options.json`은 [IANA zone.tab](https://data.iana.org/time-zones/tzdb/zone.tab)의 2026-09-26 조회본에서 국가·구역·설명만 저장합니다. [공개 도메인](https://data.iana.org/time-zones/tzdb/LICENSE) 자료입니다. 국가별 구역 표시를 위한 호환성 표이며 현지 오프셋 계산은 Temporal의 IANA 시간대 규칙을 사용합니다. 모든 도시의 지리 위치·좌표 검색은 구현하지 않았습니다. `scripts/build-zone-options.mjs`로 다시 만들 수 있으며 브라우저가 지원하지 않는 구역은 선택 목록에서 제외됩니다.
