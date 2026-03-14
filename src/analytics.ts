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

export function totalDonations(data: Registration[]): number {
  return data.reduce((sum, row) => sum + row.donationAmount, 0);
}

export function entryYearDistribution(data: Registration[]): ChartDatum[] {
  return countBy(data, 'entryYear')
    .filter((d) => d.name !== '0')
    .sort((a, b) => parseInt(a.name) - parseInt(b.name));
}
