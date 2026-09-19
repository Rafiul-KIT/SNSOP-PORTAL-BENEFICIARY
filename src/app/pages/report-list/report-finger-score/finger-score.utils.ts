import { FingerScore } from './finger-score.service';

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

// Quote every cell and neutralize spreadsheet formulas in text fields.
export function scoresCsv(scores: FingerScore[]): string {
  const cell = (value: unknown): string => {
    let text = value == null ? '' : String(value);
    if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const headers = ['Household number', 'Name', 'Type', ...FINGER_COLUMNS.map(f => `${f.hand} ${f.label}`)];
  return '\uFEFF' + [headers, ...scores.map(score => [score.householdNumber, score.name, score.type,
    ...FINGER_COLUMNS.map(f => score[f.field])])].map(row => row.map(cell).join(',')).join('\r\n');
}
