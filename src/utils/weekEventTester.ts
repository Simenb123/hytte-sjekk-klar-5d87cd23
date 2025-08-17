// Utility for testing week event filtering patterns locally

export const testWeekEventPatterns = (eventTitle: string): boolean => {
  const title = eventTitle.toLowerCase();
  
  const weekPatterns = [
    { pattern: /uke \d+( i \d+)?/i, name: 'Norwegian Uke Pattern' },
    { pattern: /^uke \d+/i, name: 'Starts with Uke' },
    { pattern: /uke/i, name: 'Contains Uke' },
    { pattern: /week \d+/i, name: 'English Week' },
    { pattern: /ukenr/i, name: 'Week Number' }
  ];
  
  let isWeekEvent = false;
  
  weekPatterns.forEach(({ pattern, name }) => {
    const matches = pattern.test(title);
    if (matches) {
      console.log(`🧪 WEEK TEST - "${eventTitle}" matched pattern: ${name}`);
      isWeekEvent = true;
    }
  });
  
  return isWeekEvent;
};

export const debugWeekEventFiltering = () => {
  console.log('🧪 TESTING WEEK EVENT PATTERNS');
  
  const testCases = [
    'Uke 34 i 2025',
    'uke 35',
    'Week 34',
    'Normal meeting',
    'Ukenr 36',
    'Meeting with uke in title',
    'WEEK 37 IN 2025'
  ];
  
  testCases.forEach(testCase => {
    const shouldFilter = testWeekEventPatterns(testCase);
    console.log(`🧪 "${testCase}" -> Filter: ${shouldFilter ? 'YES' : 'NO'}`);
  });
};