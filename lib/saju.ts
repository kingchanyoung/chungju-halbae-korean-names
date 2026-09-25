import { Temporal } from '@js-temporal/polyfill';
import { deriveSaju, ELEMENT_EN, STEM_ELEMENT, type Element, type Pillar } from 'k-saju';

export type BirthInput = {
  birthDate: string;
  birthTime: string | null;
  birthZone: string | null;
};

export type SajuSummary = {
  basis: 'date' | 'date_time';
  year: Pillar | null;
  month: Pillar | null;
  day: Pillar;
  hour: Pillar | null;
  dayElement: Element;
  dayElementEnglish: string;
  boundaryUncertain: boolean;
  convention: string;
  interpretation: string;
};

export function validateBirthInput(record: Record<string, unknown>):
  | { ok: true; input: BirthInput }
  | { ok: false; error: string } {
  const birthDate = typeof record.birthDate === 'string' ? record.birthDate.trim() : '';
  const birthTime = typeof record.birthTime === 'string' ? record.birthTime.trim() : '';
  const birthZone = typeof record.birthZone === 'string' ? record.birthZone.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return { ok: false, error: 'Enter your birth date in YYYY-MM-DD format.' };
  }
  try {
    const date = Temporal.PlainDate.from(birthDate);
    const today = Temporal.Now.plainDateISO('UTC').add({ days: 1 });
    if (date.year < 1901 || date.year > 2050 || Temporal.PlainDate.compare(date, today) > 0) {
      return { ok: false, error: 'Enter a birth date from 1901 through today.' };
    }
  } catch {
    return { ok: false, error: 'Enter a real Gregorian birth date.' };
  }
  if (birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
    return { ok: false, error: 'Enter a valid birth time or leave it unknown.' };
  }
  if (birthTime && (!birthZone || birthZone.length > 80)) {
    return { ok: false, error: 'Choose the time zone of your birthplace when adding a birth time.' };
  }
  if (!birthTime && birthZone) {
    return { ok: false, error: 'Add a birth time or clear the birthplace time zone.' };
  }
  if (birthZone) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: birthZone });
    } catch {
      return { ok: false, error: 'Choose a valid birthplace time zone, such as Asia/Seoul.' };
    }
  }
  return {
    ok: true,
    input: { birthDate, birthTime: birthTime || null, birthZone: birthZone || null },
  };
}

export function calculateSaju(input: BirthInput): SajuSummary {
  const date = input.birthDate;
  let chart: ReturnType<typeof deriveSaju>;
  let year: Pillar | null;
  let month: Pillar | null;
  let boundaryUncertain = false;

  if (input.birthTime && input.birthZone) {
    const [yearPart, monthPart, dayPart] = date.split('-').map(Number);
    const [hourPart, minutePart] = input.birthTime.split(':').map(Number);
    let local: Temporal.ZonedDateTime;
    try {
      local = Temporal.ZonedDateTime.from({
        timeZone: input.birthZone,
        year: yearPart,
        month: monthPart,
        day: dayPart,
        hour: hourPart,
        minute: minutePart,
      }, { disambiguation: 'reject' });
    } catch {
      throw new Error('That local birth time is missing or repeated because of a clock change. Check the time or use date only.');
    }
    chart = deriveSaju({
      date,
      time: input.birthTime,
      calendar: 'solar',
      tzOffsetMin: local.offsetNanoseconds / 60_000_000_000,
    });
    year = chart.year;
    month = chart.month;
  } else {
    // A local civil date is enough for the day pillar under the midnight convention.
    // Compare the earliest and latest possible global instants for that local date.
    // If a solar-term boundary may lie between them, leave year/month undecided.
    chart = deriveSaju({ date, calendar: 'solar', tzOffsetMin: 540 });
    const earliest = deriveSaju({ date, time: '00:00', calendar: 'solar', tzOffsetMin: 14 * 60 });
    const latest = deriveSaju({ date, time: '23:59', calendar: 'solar', tzOffsetMin: -12 * 60 });
    year = earliest.year.hanja === latest.year.hanja ? earliest.year : null;
    month = earliest.month.hanja === latest.month.hanja ? earliest.month : null;
    boundaryUncertain = year === null || month === null;
  }

  const dayElement = STEM_ELEMENT[chart.day.stem];
  if (!dayElement) throw new Error('The day-stem element could not be calculated.');
  return {
    basis: input.birthTime ? 'date_time' : 'date',
    year,
    month,
    day: chart.day,
    hour: input.birthTime ? chart.hour : null,
    dayElement,
    dayElementEnglish: ELEMENT_EN[dayElement],
    boundaryUncertain,
    convention: input.birthTime
      ? 'Birthplace civil time with historical IANA offset; day changes at local midnight; no true-solar correction.'
      : 'Local civil birth date; day changes at midnight; hour omitted. Year/month shown only when stable across world time zones.',
    interpretation: 'The day-stem element is a traditional Four Pillars reference, not a finding that an element is missing or needs correction.',
  };
}
