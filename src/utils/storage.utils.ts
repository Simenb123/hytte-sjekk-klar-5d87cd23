
// Load data from localStorage with improved error handling
export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    console.log(`[Storage] Attempting to load ${key} from localStorage`);
    const savedData = localStorage.getItem(key);
    
    if (savedData === null) {
      console.log(`[Storage] No data found for ${key}, using fallback`);
      return fallback;
    }
    
    try {
      const parsedData = JSON.parse(savedData);
      console.log(`[Storage] Successfully loaded ${key} from localStorage:`, 
        typeof parsedData === 'object' ? 
          (Array.isArray(parsedData) ? `Array with ${parsedData.length} items` : 'Object') : 
          parsedData
      );
      return parsedData;
    } catch (parseError) {
      console.error(`[Storage] Error parsing ${key} from localStorage:`, parseError);
      return fallback;
    }
  } catch (error) {
    console.error(`[Storage] Error accessing ${key} from localStorage:`, error);
    return fallback;
  }
};

// Save data to localStorage with improved error handling
export const saveToStorage = <T>(key: string, data: T): boolean => {
  try {
    console.log(
      `[Storage] Saving to ${key} in localStorage:`,
      typeof data === 'object'
        ? Array.isArray(data)
          ? `Array with ${(data as unknown[]).length} items`
          : 'Object'
        : data,
    );
    
    const jsonString = JSON.stringify(data);
    localStorage.setItem(key, jsonString);
    
    // Verify save was successful
    const savedData = localStorage.getItem(key);
    if (savedData === jsonString) {
      console.log(`[Storage] Successfully saved ${key} to localStorage`);
      return true;
    } else {
      console.error(`[Storage] Verification failed for ${key} - data may not have been saved correctly`);
      return false;
    }
  } catch (error) {
    console.error(`[Storage] Error saving ${key} to localStorage:`, error);
    return false;
  }
};

// Remove item from localStorage
export const removeFromStorage = (key: string): boolean => {
  try {
    console.log(`[Storage] Removing ${key} from localStorage`);
    localStorage.removeItem(key);
    
    // Verify removal was successful
    if (localStorage.getItem(key) === null) {
      console.log(`[Storage] Successfully removed ${key} from localStorage`);
      return true;
    } else {
      console.error(`[Storage] Failed to remove ${key} from localStorage`);
      return false;
    }
  } catch (error) {
    console.error(`[Storage] Error removing ${key} from localStorage:`, error);
    return false;
  }
};

// Clear all localStorage
export const clearStorage = (): boolean => {
  try {
    console.log(`[Storage] Clearing all localStorage items`);
    localStorage.clear();
    console.log(`[Storage] Successfully cleared localStorage`);
    return true;
  } catch (error) {
    console.error(`[Storage] Error clearing localStorage:`, error);
    return false;
  }
};
