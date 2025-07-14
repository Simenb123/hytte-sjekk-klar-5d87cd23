export type Season = 'winter' | 'summer' | 'all';

export const seasonOptions: { value: Season; label: string }[] = [
  { value: 'all', label: 'Hele året' },
  { value: 'winter', label: 'Vinter' },
  { value: 'summer', label: 'Sommer' },
];
