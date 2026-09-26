import { writeFile } from 'node:fs/promises';
const source = 'https://data.iana.org/time-zones/tzdb/zone.tab';
const response = await fetch(source);
if (!response.ok) throw new Error(`IANA source unavailable: ${response.status}`);
const regions = new Intl.DisplayNames('en', { type: 'region' });
const options = (await response.text()).split('\n').filter(line => line && !line.startsWith('#')).map(line => {
  const [countryCode, , id, comment = ''] = line.split('\t');
  const country = regions.of(countryCode) || countryCode;
  return { id, country, countryCode, city: id.split('/').slice(1).join(' · ').replaceAll('_', ' '), region: comment };
});
await writeFile(new URL('../lib/time-zone-options.json', import.meta.url), JSON.stringify({ source, license: 'Public domain', retrievedAt: '2026-09-26', options }, null, 2) + '\n');
console.log(`Saved ${options.length} IANA region options.`);
