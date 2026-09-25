"""Build the small deployable given-name index from licensed source snapshots.

Usage: python scripts/build-name-corpus.py --research-dir ../output/name_corpus_research

The NVIDIA persona rows are synthetic, so their counts are only a screening
signal. Court daily rows are observed Seoul registrations for 2025-01-01
through 2025-06-08, with only each day's published top 20 represented.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path


SOURCE = "https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea"
COURT = "https://stfamily.scourt.go.kr/st/StFrrStatcsView.do?pgmId=090000000025"
EXCLUDED = {
    # Common words, places, brands, or transliterations that do not fit the
    # default Korean-style given-name recommendation. Review this list often.
    "운지", "환영", "동경", "인기", "일기", "형태", "대우", "주상", "보석",
    "다윗", "요셉", "필립", "광광", "굉일", "귀사", "엘리", "엄지",
}


def read_personas(directory: Path, prefix: str):
    total = Counter()
    male = Counter()
    female = Counter()
    for path in sorted(directory.glob(f"{prefix}_*.json")):
        rows = json.loads(path.read_text(encoding="utf-8"))
        for full_name, sex, uses, *_ in rows:
            if len(full_name) != 3 or not all("가" <= part <= "힣" for part in full_name):
                continue
            given = full_name[1:]
            total[given] += uses
            if sex == "남자":
                male[given] += uses
            elif sex == "여자":
                female[given] += uses
    if not total:
        raise ValueError(f"No snapshot rows for {prefix} in {directory}")
    return total, male, female


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--research-dir", type=Path, required=True)
    args = parser.parse_args()
    root = args.research_dir
    all_names, _, _ = read_personas(root, "nvidia_names_shard")
    young, male, female = read_personas(root, "nvidia_young_names_shard")
    court_rows = {}
    with (root / "court_daily_seoul_2025_distinct_names.csv").open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            name = row["name"]
            if len(name) == 2 and all("가" <= part <= "힣" for part in name):
                court_rows[name] = row

    corpus = []
    for name in sorted(set(all_names) | set(court_rows)):
        if name in EXCLUDED:
            continue
        young_uses = young[name]
        all_uses = all_names[name]
        court = court_rows.get(name, {})
        court_uses = int(court.get("total_observed_births", 0))
        qualifies_synthetic = young_uses >= 10 and all_uses > 0 and young_uses / all_uses >= 0.30
        qualifies_court = court_uses >= 3
        if not (qualifies_synthetic or qualifies_court):
            continue
        cm = int(court.get("male_observed_births", 0))
        cf = int(court.get("female_observed_births", 0))
        # Use observed registrations when the small court sample is adequate.
        if court_uses >= 10:
            male_share = cm / court_uses
        elif young_uses >= 10:
            male_share = male[name] / young_uses
        else:
            male_share = cm / court_uses
        presentation = "masculine" if male_share >= .70 else "feminine" if male_share <= .30 else "neutral"
        corpus.append({
            "hangul": name,
            "presentation": presentation,
            "syntheticYoungUses": young_uses,
            "syntheticAllUses": all_uses,
            "courtSeoulTop20Births": court_uses,
        })

    output = {
        "schemaVersion": 1,
        "source": SOURCE,
        "license": "CC BY 4.0",
        "courtSource": COURT,
        "courtScope": "Seoul daily top-20 published names, 2025-01-01 through 2025-06-08",
        "screen": "2 Hangul syllables; synthetic ages 19-40 with >=10 uses and >=30% of all-age uses, or >=3 observed court births; manual exclusions",
        "count": len(corpus),
        "names": corpus,
    }
    target = Path(__file__).resolve().parents[1] / "lib" / "korean_name_corpus.json"
    target.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(corpus)} given names -> {target}")
    print(dict(Counter(row["presentation"] for row in corpus)))


if __name__ == "__main__":
    main()
