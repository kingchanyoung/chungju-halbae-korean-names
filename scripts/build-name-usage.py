"""Build an aggregate name-usage reference; never send visitor names to SSA."""
import hashlib
import io
import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from zipfile import ZipFile
from urllib.error import HTTPError
import sys

SOURCE = 'https://www.ssa.gov/oact/babynames/names.zip'
root = Path(__file__).resolve().parents[1]
cache = root.parent / 'output' / 'name_usage_research'
cache.mkdir(parents=True, exist_ok=True)
archive = cache / 'ssa-names.zip'
counts = defaultdict(lambda: [0] * 8)
years = []
distribution_url = SOURCE
try:
    if not archive.exists():
        with urlopen(Request(SOURCE, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60) as response:
            archive.write_bytes(response.read())
except HTTPError as error:
    if error.code != 403:
        raise
if archive.exists():
    raw = archive.read_bytes()
    rows = []
    with ZipFile(io.BytesIO(raw)) as z:
        readme = next((f for f in z.namelist() if 'readme' in f.lower()), None)
        if readme:
            (cache / 'ssa-readme.txt').write_bytes(z.read(readme))
        for f in sorted(z.namelist()):
            if f.startswith('yob') and f.endswith('.txt') and 1950 <= int(f[3:7]) <= 2025:
                year = int(f[3:7])
                years.append(year)
                rows.extend((year, *line.split(',')) for line in z.read(f).decode('utf-8-sig').splitlines())
else:
    # Documented SSA redistribution, CC0, pinned to an exact repository commit.
    # python -m pip install --target ../output/name_usage_research/python_vendor pyreadr
    sys.path.insert(0, str(cache / 'python_vendor'))
    import pyreadr
    commit = '4391c25ea10b8b0589cdbab63067de3bc8b3a628'
    distribution_url = f'https://raw.githubusercontent.com/hadley/babynames/{commit}/data/babynames.rda'
    data_file = cache / f'babynames-{commit}.rda'
    if not data_file.exists():
        with urlopen(distribution_url, timeout=60) as response:
            data_file.write_bytes(response.read())
    raw = data_file.read_bytes()
    frame = pyreadr.read_r(str(data_file))['babynames']
    frame = frame[(frame.year >= 1950) & (frame.year <= 2025)]
    years = sorted(int(year) for year in frame.year.unique())
    rows = ((int(row.year), row.name, row.sex, row.n) for row in frame.itertuples())
for year, name, sex, value in rows:
    if sex not in ('M', 'F') or not name.isascii() or not name.isalpha():
        continue
    bucket = 0 if year < 1980 else 1 if year < 2000 else 2
    index = 0 if sex == 'M' else 1
    record = counts[name.lower()]
    record[index] += int(value)
    record[2 + bucket * 2 + index] += int(value)
assert years == list(range(1950, max(years) + 1)), 'Incomplete source period.'
records = {name: value for name, value in sorted(counts.items()) if sum(value[:2]) >= 1000}
result = {
    'source': 'U.S. Social Security Administration, national birth-name files',
    'sourceUrl': 'https://www.ssa.gov/oact/babynames/limits.html',
    'backgroundUrl': 'https://www.ssa.gov/oact/babynames/background.html',
    'downloadUrl': distribution_url,
    'downloadSha256': hashlib.sha256(raw).hexdigest(),
    'redistributionUrl': 'https://hadley.github.io/babynames/' if distribution_url != SOURCE else None,
    'redistributionLicense': 'CC0' if distribution_url != SOURCE else None,
    'retrievedAtUtc': datetime.now(timezone.utc).isoformat(),
    'years': [1950, max(years)],
    'columns': ['M', 'F', 'M1950_1979', 'F1950_1979', 'M1980_1999', 'F1980_1999', f'M2000_{max(years)}', f'F2000_{max(years)}'],
    'minimumReportedCount': 1000,
    'qualifications': 'US births only; recorded sex may contain errors; annual name/sex counts below five are omitted; spelling variants are separate. These are name-use records, not the gender of a visitor.',
    'names': records,
}
(root / 'lib' / 'original-name-usage.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print('Usage reference built:', len(records), 'names,', len(years), 'years')
for name in ['jason', 'james', 'michael', 'emma', 'olivia', 'alex', 'taylor', 'jordan']:
    m, f = records[name][:2]
    print(name, m, f, 'M share:', round(m / (m + f), 4))
