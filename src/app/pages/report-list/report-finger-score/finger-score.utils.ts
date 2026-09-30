import type { HouseholdScores, MemberType } from './finger-score.service';

export const FINGER_COLUMNS = [
  { field: 'leftThumb', label: 'Thumb', hand: 'Left' },
  { field: 'leftIndex', label: 'Index', hand: 'Left' },
  { field: 'leftMiddle', label: 'Middle', hand: 'Left' },
  { field: 'leftRing', label: 'Ring', hand: 'Left' },
  { field: 'leftSmall', label: 'Little', hand: 'Left' },
  { field: 'rightThumb', label: 'Thumb', hand: 'Right' },
  { field: 'rightIndex', label: 'Index', hand: 'Right' },
  { field: 'rightMiddle', label: 'Middle', hand: 'Right' },
  { field: 'rightRing', label: 'Ring', hand: 'Right' },
  { field: 'rightSmall', label: 'Little', hand: 'Right' },
] as const;

export type FingerField = typeof FINGER_COLUMNS[number]['field'];

export const MEMBER_TYPE_ORDER: MemberType[] = ['BENEFICIARY', 'NOMINEE', 'ALTERNATE_1', 'ALTERNATE_2'];

const MEMBER_TYPE_LABELS: Record<string, string> = {
  BENEFICIARY: 'Beneficiary',
  NOMINEE: 'Nominee',
  ALTERNATE_1: 'Alternate 1',
  ALTERNATE_2: 'Alternate 2',
};

export function memberTypeLabel(type: string): string {
  return MEMBER_TYPE_LABELS[type] ?? (type || 'Member').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

/** Beneficiary scores below this are flagged as low quality. */
export const LOW_SCORE_THRESHOLD = 40;

export type ScoreStatus = 'missing' | 'recapture' | 'low' | 'ok';

export function toScore(value: unknown): number | null {
  if (value == null || value === '') return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

export function scoreStatus(value: number | null, type: string): ScoreStatus {
  if (value == null) return 'missing';
  if (value < 0) return 'recapture';
  return type === 'BENEFICIARY' && value < LOW_SCORE_THRESHOLD ? 'low' : 'ok';
}

export interface HouseholdFlags {
  recapture: number;
  low: number;
  scored: number;
}

export function householdFlags(household: HouseholdScores): HouseholdFlags {
  const flags: HouseholdFlags = { recapture: 0, low: 0, scored: 0 };
  for (const member of household.members) {
    for (const finger of FINGER_COLUMNS) {
      const status = scoreStatus(member[finger.field], member.type);
      if (status !== 'missing') flags.scored++;
      if (status === 'recapture') flags.recapture++;
      if (status === 'low') flags.low++;
    }
  }
  return flags;
}

// Quote every cell and neutralize spreadsheet formulas in text fields.
export function householdsCsv(households: HouseholdScores[]): string {
  const cell = (value: unknown): string => {
    let text = value == null ? '' : String(value);
    if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const headers = ['Household number', 'Member type', ...FINGER_COLUMNS.map(f => `${f.hand} ${f.label}`)];
  const rows = households.flatMap(household => household.members.map(member => [
    household.householdNumber, memberTypeLabel(member.type), ...FINGER_COLUMNS.map(f => member[f.field]),
  ]));
  return '﻿' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
}
