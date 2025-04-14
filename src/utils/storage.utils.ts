
// Load data from localStorage with improved error handling
export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const savedData = localStorage.getItem(key);
    if (savedData === null) {
      console.log(`[Storage] No data found for ${key}, using fallback`);
      return fallback;
    }
    
    const parsedData = JSON.parse(savedData);
    console.log(`[Storage] Successfully loaded ${key} from localStorage`);
    return parsedData;
  } catch (error) {
    console.error(`[Storage] Error loading ${key} from localStorage:`, error);
    return fallback;
  }
};

// Save data to localStorage with improved error handling
export const saveToStorage = (key: string, data: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[Storage] Successfully saved ${key} to localStorage`);
    return true;
  } catch (error) {
    console.error(`[Storage] Error saving ${key} to localStorage:`, error);
    return false;
  }
};

// Remove item from localStorage
export const removeFromStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    console.log(`[Storage] Successfully removed ${key} from localStorage`);
    return true;
  } catch (error) {
    console.error(`[Storage] Error removing ${key} from localStorage:`, error);
    return false;
  }
};

// Clear all localStorage
export const clearStorage = (): boolean => {
  try {
    localStorage.clear();
    console.log(`[Storage] Successfully cleared localStorage`);
    return true;
  } catch (error) {
    console.error(`[Storage] Error clearing localStorage:`, error);
    return false;
  }
};
