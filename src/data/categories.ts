export const CATEGORIES = {
  'Klær': [
    'Skjørt',
    'Kjole', 
    'Bukse',
    'Shorts',
    'Sokker',
    'Undertøy',
    'Topp',
    'Genser',
    'Jakke',
    'Lue',
    'Sko',
    'Tilbehør'
  ],
  'Sport': [
    'Langrennski',
    'Langrennstaver',
    'Alpint',
    'Alpinstaver',
    'Skisko',
    'Bindinger',
    'Hjelm',
    'Briller',
    'Hansker',
    'Sportsbag',
    'Annet sportsutstyr'
  ],
  'Elektronikk': [
    'Telefon',
    'Nettbrett',
    'Laptop',
    'Kamera',
    'Høretelefoner',
    'Ladere',
    'Kabler',
    'Annen elektronikk'
  ],
  'Verktøy': [
    'Håndverktøy',
    'Elektrisk verktøy',
    'Måleverktøy',
    'Hagearbeid',
    'Annet verktøy'
  ],
  'Bøker': [
    'Romaner',
    'Fagbøker',
    'Magasiner',
    'Tegneserier',
    'Annet lesestoff'
  ],
  'Husstand': [
    'Kjøkkenutstyr',
    'Rengjøring',
    'Tekstiler',
    'Dekorasjon',
    'Annet husstand'
  ],
  'Annet': []
};

export const getCategorySubcategories = (category: string): string[] => {
  return CATEGORIES[category as keyof typeof CATEGORIES] || [];
};

export const getAllCategories = (): string[] => {
  return Object.keys(CATEGORIES);
};