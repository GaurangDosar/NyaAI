/**
 * Storage utilities to handle corrupted or stale browser storage
 */

const STORAGE_VERSION_KEY = 'app_storage_version';
const CURRENT_VERSION = '1.0.0';

/**
 * Check if storage version is outdated and clear if needed
 */
export function checkStorageVersion() {
  try {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    
    if (storedVersion !== CURRENT_VERSION) {
      console.log(`Storage version mismatch (stored: ${storedVersion}, current: ${CURRENT_VERSION}). Clearing...`);
      clearAppStorage();
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      return true; // Storage was cleared
    }
    
    return false; // Storage is up to date
  } catch (error) {
    console.error('Error checking storage version:', error);
    return false;
  }
}

/**
 * Clear all app-related storage except essential items
 */
export function clearAppStorage() {
  try {
    // Get list of all keys before clearing
    const keys = Object.keys(localStorage);
    
    // Items to preserve (if any)
    const preserveKeys: string[] = [];
    const preserved: { [key: string]: string | null } = {};
    
    // Save items we want to keep
    preserveKeys.forEach(key => {
      preserved[key] = localStorage.getItem(key);
    });
    
    // Clear everything
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore preserved items
    Object.entries(preserved).forEach(([key, value]) => {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    });
    
    console.log('App storage cleared successfully');
  } catch (error) {
    console.error('Error clearing app storage:', error);
  }
}

/**
 * Check if Supabase auth storage is corrupted
 */
export function checkSupabaseAuthStorage(): boolean {
  try {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    );
    
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          JSON.parse(value);
        } catch {
          console.error(`Corrupted storage detected: ${key}`);
          localStorage.removeItem(key);
          return true; // Corruption detected
        }
      }
    }
    
    return false; // No corruption
  } catch (error) {
    console.error('Error checking Supabase storage:', error);
    return false;
  }
}

/**
 * Initialize storage checks on app load
 */
export function initializeStorage() {
  console.log('Initializing storage checks...');
  
  // Check for corrupted auth storage
  const hasCorruption = checkSupabaseAuthStorage();
  if (hasCorruption) {
    console.warn('Corrupted storage was detected and cleaned');
  }
  
  // Check storage version
  const wasCleared = checkStorageVersion();
  if (wasCleared) {
    console.log('Storage was cleared due to version mismatch');
  }
  
  return { hasCorruption, wasCleared };
}
