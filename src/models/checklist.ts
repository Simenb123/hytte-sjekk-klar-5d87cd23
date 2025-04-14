
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

export type ChecklistType = 'arrival' | 'departure';

export const initialArrivals: ChecklistItem[] = [
  { id: 'arr-1', text: 'Slå på strøm/hovedbryter', isCompleted: false },
  { id: 'arr-2', text: 'Sett på vann', isCompleted: false },
  { id: 'arr-3', text: 'Sett varmepumpe til komfortinnstilling', isCompleted: false },
  { id: 'arr-4', text: 'Sjekk at varmtvannstank er på', isCompleted: false },
  { id: 'arr-5', text: 'Kontrollér at hovedsikringer er aktive', isCompleted: false },
  { id: 'arr-6', text: 'Sjekk at alt er normalt, ingen synlige skader', isCompleted: false },
];

export const initialDepartureAreas: ChecklistArea[] = [
  {
    id: 'main',
    name: 'Hovedhytta',
    isCompleted: false,
    items: [
      { id: 'main-1', text: 'Sett varmepumpe i økonomimodus', isCompleted: false },
      { id: 'main-2', text: 'Lukk alle vinduer', isCompleted: false },
      { id: 'main-3', text: 'Lås alle dører', isCompleted: false },
      { id: 'main-4', text: 'Slå av alle lys', isCompleted: false },
      { id: 'main-5', text: 'Kontroller at alle kraner er lukket', isCompleted: false },
    ],
  },
  {
    id: 'annex',
    name: 'Tilbygget',
    isCompleted: false,
    items: [
      { id: 'annex-1', text: 'Etterfyll vann på bad', isCompleted: false },
      { id: 'annex-2', text: 'Varmekabler satt til ønsket temperatur', isCompleted: false },
      { id: 'annex-3', text: 'Alle vinduer lukket', isCompleted: false },
    ],
  },
  {
    id: 'small-house',
    name: 'Anekset',
    isCompleted: false,
    items: [
      { id: 'small-1', text: 'Slå av strømtilførsel', isCompleted: false },
      { id: 'small-2', text: 'Lukk vinduer og dører', isCompleted: false },
      { id: 'small-3', text: 'Sjekk at ovner og varmekilder er avslått', isCompleted: false },
    ],
  },
  {
    id: 'hottub',
    name: 'Boblebadet',
    isCompleted: false,
    items: [
      { id: 'hottub-1', text: 'Juster temperatur ned (sparemodus)', isCompleted: false },
      { id: 'hottub-2', text: 'Sikre boblebadlokket', isCompleted: false },
      { id: 'hottub-3', text: 'Rengjøring utført ved behov', isCompleted: false },
    ],
  },
];
