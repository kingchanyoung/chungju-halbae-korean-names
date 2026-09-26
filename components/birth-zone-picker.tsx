'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from './ui/input';
import zoneData from '@/lib/time-zone-options.json';

const aliases: Record<string, string> = {
  'America/New_York': 'United States US USA Eastern Boston Miami',
  'America/Chicago': 'United States US USA Central Dallas Houston',
  'America/Denver': 'United States US USA Mountain',
  'America/Phoenix': 'United States US USA Arizona',
  'America/Los_Angeles': 'United States US USA Pacific San Francisco Seattle',
  'America/Anchorage': 'United States US USA Alaska',
  'Pacific/Honolulu': 'United States US USA Hawaii',
  'America/Toronto': 'Canada Montreal Ottawa', 'America/Vancouver': 'Canada',
  'Europe/London': 'United Kingdom UK Britain England Scotland Wales',
  'Europe/Paris': 'France', 'Europe/Berlin': 'Germany', 'Europe/Rome': 'Italy',
  'Europe/Madrid': 'Spain', 'Europe/Dublin': 'Ireland', 'Europe/Lisbon': 'Portugal',
  'Asia/Seoul': 'South Korea Busan Incheon', 'Asia/Tokyo': 'Japan Osaka',
  'Asia/Shanghai': 'China Beijing', 'Asia/Kolkata': 'India Mumbai Delhi',
  'Asia/Calcutta': 'India Kolkata Mumbai Delhi', 'Asia/Kathmandu': 'Nepal',
  'Asia/Katmandu': 'Nepal Kathmandu', 'Asia/Manila': 'Philippines',
  'Asia/Bangkok': 'Thailand', 'Asia/Jakarta': 'Indonesia', 'Asia/Dubai': 'UAE United Arab Emirates',
  'Africa/Lagos': 'Nigeria', 'Africa/Nairobi': 'Kenya', 'Africa/Johannesburg': 'South Africa',
  'Africa/Cairo': 'Egypt', 'Africa/Casablanca': 'Morocco',
  'Australia/Sydney': 'Australia New South Wales', 'Australia/Melbourne': 'Australia Victoria',
  'Australia/Brisbane': 'Australia Queensland', 'Australia/Perth': 'Australia Western',
  'Pacific/Auckland': 'New Zealand', 'America/Sao_Paulo': 'Brazil',
  'America/Argentina/Buenos_Aires': 'Argentina', 'America/Buenos_Aires': 'Argentina',
  'America/Mexico_City': 'Mexico',
};
const fallback = zoneData.options.map(item => item.id);
const label = (zone: string) => { const entry = zoneData.options.find(item => item.id === zone); return entry ? `${entry.city} · ${entry.country}` : zone.replaceAll('_', ' ').split('/').reverse().join(' · '); };

export function BirthZonePicker({ value, onChange, enabled }: { value: string; onChange: (zone: string) => void; enabled: boolean }) {
  const [search, setSearch] = useState('');
  const [zones, setZones] = useState(fallback);
  useEffect(() => { setZones(fallback.filter(zone => { try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(); return true; } catch { return false; } })); }, []);
  const matches = useMemo(() => [...new Set([...(value ? [value] : []), ...zones])].filter(zone => { const entry = zoneData.options.find(item => item.id === zone); return zone === value || `${label(zone)} ${zone} ${entry?.countryCode || ''} ${entry?.region || ''} ${aliases[zone] || ''}`.toLowerCase().includes(search.trim().toLowerCase()); }).sort((a, b) => label(a).localeCompare(label(b))), [zones, value, search]);
  return <div className="zone-picker">
    <label htmlFor="birth-zone-search">Find your birth region <small>Required with time</small></label>
    <Input id="birth-zone-search" className="form-input" type="search" disabled={!enabled} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search a city, region, or country" autoComplete="off"/>
    <label htmlFor="birth-zone">Choose the time zone</label>
    <select id="birth-zone" className="form-input" value={value} disabled={!enabled} required={enabled} onChange={event => onChange(event.target.value)}>
      <option value="">Select the region where you were born</option>
      {matches.map(zone => <option key={zone} value={zone}>{label(zone)}</option>)}
    </select>
    {!matches.length && <p className="field-help">Try a nearby major city in the same time zone, or a continent such as Africa.</p>}
    <p className="field-help">This lists time-zone cities and regions, not every city. A country may have several zones. Choose the one your birthplace uses; we apply the historical offset, including daylight saving time. If you cannot identify it, leave birth time blank.</p>
  </div>;
}
