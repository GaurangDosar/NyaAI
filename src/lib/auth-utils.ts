/**
 * Utility functions for handling auth-related issues
 */

/**
 * Clear all Supabase-related data from localStorage
 * This is useful when session gets corrupted and user is stuck
 */
export const clearSupabaseStorage = () => {
  console.log('clearSupabaseStorage - Starting cleanup');
  
  // Find all Supabase-related keys
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-') || key.includes('auth')
  );
  
  console.log('clearSupabaseStorage - Found keys to remove:', keysToRemove);
  
  // Remove each key
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log('clearSupabaseStorage - Removed:', key);
    } catch (error) {
      console.error('clearSupabaseStorage - Error removing key:', key, error);
    }
  });
  
  // Also clear sessionStorage just in case
  try {
    sessionStorage.clear();
    console.log('clearSupabaseStorage - Cleared sessionStorage');
  } catch (error) {
    console.error('clearSupabaseStorage - Error clearing sessionStorage:', error);
  }
  
  console.log('clearSupabaseStorage - Cleanup complete');
  
  return keysToRemove.length;
};

/**
 * Check if auth storage might be corrupted
 */
export const isAuthStorageCorrupted = (): boolean => {
  try {
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-')
    );
    
    // Check if there are auth keys but they seem malformed
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          JSON.parse(value);
        } catch {
          console.warn('isAuthStorageCorrupted - Malformed data in key:', key);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('isAuthStorageCorrupted - Error checking storage:', error);
    return true;
  }
};

/**
 * Get diagnostic info about current auth state
 */
export const getAuthDiagnostics = () => {
  const keys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  
  const diagnostics = {
    totalKeys: keys.length,
    keys: keys,
    isCorrupted: isAuthStorageCorrupted(),
    localStorageAvailable: typeof localStorage !== 'undefined',
    sessionStorageAvailable: typeof sessionStorage !== 'undefined'
  };
  
  console.log('Auth Diagnostics:', diagnostics);
  return diagnostics;
};
