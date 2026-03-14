import type { Registration, ChartDatum } from './types';

export function countBy(data: Registration[], key: keyof Registration): ChartDatum[] {
  const counts: Record<string, number> = {};
  for (const row of data) {
    const val = String(row[key]).trim();
    if (!val) continue;
    counts[val] = (counts[val] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function countByRoles(data: Registration[]): ChartDatum[] {
  const counts: Record<string, number> = {};
  for (const row of data) {
    const roles = row.participationRole.split(',').map((r) => r.trim()).filter(Boolean);
    for (const role of roles) {
      counts[role] = (counts[role] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function countByJNVDistrict(data: Registration[]): ChartDatum[] {
  const counts: Record<string, number> = {};
  for (const row of data) {
    const jnv = row.entryJNV.replace(/^BR\s*-\s*/, '').trim();
    if (!jnv) continue;
    counts[jnv] = (counts[jnv] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function registrationTimeline(data: Registration[]): ChartDatum[] {
  const counts: Record<string, number> = {};
  for (const row of data) {
    const datePart = row.timestamp.split(' ')[0] ?? '';
    if (!datePart) continue;
    counts[datePart] = (counts[datePart] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const [am, ad, ay] = a.name.split('/').map(Number);
      const [bm, bd, by] = b.name.split('/').map(Number);
      return (ay - by) || (am - bm) || (ad - bd);
    });
}

export function registrationByThreeHourWindow(data: Registration[]): ChartDatum[] {
  const windows = Array.from({ length: 8 }, (_, i) => i * 3);
  const counts: Record<number, number> = {};

  for (const start of windows) {
    counts[start] = 0;
  }

  for (const row of data) {
    const match = row.timestamp.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (!match) continue;

    let hour = parseInt(match[1] ?? '0', 10);
    const meridiem = (match[3] ?? '').toUpperCase();

    if (meridiem === 'AM' && hour === 12) hour = 0;
    if (meridiem === 'PM' && hour < 12) hour += 12;

    if (Number.isNaN(hour) || hour < 0 || hour > 23) continue;

    const startHour = Math.floor(hour / 3) * 3;
    counts[startHour] = (counts[startHour] || 0) + 1;
  }

  const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return windows
    .map((start) => {
      const end = (start + 3) % 24;
      return {
        name: `${fmt(start)}-${fmt(end)}`,
        value: counts[start] || 0,
      };
    })
    .filter((d) => d.value > 0);
}

export function totalDonations(data: Registration[]): number {
  return data.reduce((sum, row) => sum + row.donationAmount, 0);
}

export function entryYearDistribution(data: Registration[]): ChartDatum[] {
  return countBy(data, 'entryYear')
    .filter((d) => d.name !== '0')
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));
}
