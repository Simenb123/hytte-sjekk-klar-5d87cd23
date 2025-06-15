
export type ChecklistItem = {
  id: string;
  text: string;
  isCompleted: boolean;
};

export type ChecklistArea = {
  id: string;
  name: string;
  items: ChecklistItem[];
  isCompleted: boolean;
};

export const checklistCategories = {
  før_ankomst: 'Før ankomst',
  ankomst: 'Ankomst',
  opphold: 'Under oppholdet',
  avreise: 'Avreise',
  årlig_vedlikehold: 'Årlig vedlikehold',
};

export type ChecklistCategory = keyof typeof checklistCategories;
