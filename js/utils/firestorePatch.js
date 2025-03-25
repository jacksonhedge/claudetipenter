/**
 * Firestore Permissions Patch
 * 
 * This utility provides a temporary workaround for Firebase Firestore permission issues
 * by patching the Firestore operations to gracefully handle permission errors.
 */

/**
 * Apply the Firestore permissions patch
 * This intercepts Firestore operations and provides local storage fallbacks when permission errors occur
 */
export function applyFirestorePatch() {
  console.log('🔧 Applying Firestore permissions patch...');
  
  // Suppress 400 Bad Request console errors for write channels
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Check if this is a Firebase channel error we want to suppress
    const errorString = args.join(' ');
    if (errorString.includes('Firestore/Write/channel') && 
        errorString.includes('400 (Bad Request)')) {
      console.warn('⚠️ Suppressed Firebase write channel error - using local storage fallback');
      return;
    }
    // Otherwise, call the original console.error
    return originalConsoleError.apply(this, args);
  };
  
  // Check for global initialization flag
  if (window.FIREBASE_LOADING === true) {
    console.warn('⚠️ Firebase still loading, will try to apply patch once it\'s loaded');
    
    // Return a function that can be called later
    return () => {
      console.log('🔄 Retrying Firestore patch application...');
      return applyFirestorePatch();
    };
  }
  
  // Wait for Firebase to be available if needed
  if (typeof firebase === 'undefined' || !firebase) {
    console.warn('⚠️ Firebase not available yet, will try to apply patch once it\'s loaded');
    
    // Return a function that can be called later
    return () => {
      console.log('🔄 Retrying Firestore patch application...');
      return applyFirestorePatch();
    };
  }
  
  // Check that Firebase is properly initialized
  if (!firebase.apps || !firebase.apps.length || !firebase.app) {
    console.warn('⚠️ Firebase not initialized yet, will try to apply patch once it\'s initialized');
    
    // Return a function that can be called later
    return () => {
      console.log('🔄 Retrying Firestore patch application after initialization check...');
      return applyFirestorePatch();
    };
  }
  
  // Check if Firebase and Firestore are available
  if (firebase && firebase.firestore) {
    console.log('✅ Found Firebase Firestore, applying patch');
    
    // Store original methods
    const originalSet = firebase.firestore.DocumentReference.prototype.set;
    const originalUpdate = firebase.firestore.DocumentReference.prototype.update;
    
    // Patch set method
    firebase.firestore.DocumentReference.prototype.set = async function(...args) {
      try {
        // Try the original method first
        return await originalSet.apply(this, args);
      } catch (error) {
        console.warn('⚠️ Firestore permission error in set operation. Using local storage fallback.');
        console.warn('Path:', this.path);
        console.warn('Error:', error.message);
        
        // If it's a permission error, use local storage fallback
        if (error.code === 'permission-denied' || 
            error.message.includes('Missing or insufficient permissions')) {
          const path = this.path;
          const data = args[0];
          localStorage.setItem(`tipenter_firestore_${path}`, JSON.stringify(data));
          console.log('💾 Data saved to local storage as fallback');
          return Promise.resolve();
        }
        // Rethrow other errors
        throw error;
      }
    };
    
    // Patch update method
    firebase.firestore.DocumentReference.prototype.update = async function(...args) {
      try {
        // Try the original method first
        return await originalUpdate.apply(this, args);
      } catch (error) {
        console.warn('⚠️ Firestore permission error in update operation. Using local storage fallback.');
        console.warn('Path:', this.path);
        console.warn('Error:', error.message);
        
        // If it's a permission error, use local storage fallback
        if (error.code === 'permission-denied' || 
            error.message.includes('Missing or insufficient permissions')) {
          const path = this.path;
          const data = args[0];
          
          // Try to get existing data from local storage
          let existingData = {};
          try {
            const existing = localStorage.getItem(`tipenter_firestore_${path}`);
            if (existing) {
              existingData = JSON.parse(existing);
            }
          } catch (e) {
            console.warn('Error parsing existing data:', e);
          }
          
          // Merge existing data with updates
          const updatedData = { ...existingData, ...data };
          localStorage.setItem(`tipenter_firestore_${path}`, JSON.stringify(updatedData));
          console.log('💾 Data updated in local storage as fallback');
          return Promise.resolve();
        }
        // Rethrow other errors
        throw error;
      }
    };
    
    // Also patch getDoc to retrieve from local storage if needed
    const originalGet = firebase.firestore.DocumentReference.prototype.get;
    firebase.firestore.DocumentReference.prototype.get = async function(...args) {
      try {
        // Try the original method first
        return await originalGet.apply(this, args);
      } catch (error) {
        console.warn('⚠️ Firestore permission error in get operation. Using local storage fallback.');
        console.warn('Path:', this.path);
        console.warn('Error:', error.message);
        
        // If it's a permission error, check local storage
        if (error.code === 'permission-denied' || 
            error.message.includes('Missing or insufficient permissions')) {
          const path = this.path;
          const storedData = localStorage.getItem(`tipenter_firestore_${path}`);
          
          if (storedData) {
            console.log('📤 Retrieving data from local storage fallback');
            const data = JSON.parse(storedData);
            
            // Create a simple DocumentSnapshot-like object
            return Promise.resolve({
              exists: () => true,
              data: () => data,
              id: path.split('/').pop(),
              ref: this
            });
          }
        }
        // Rethrow other errors
        throw error;
      }
    };
    
    console.log('✅ Firestore permission patch applied successfully!');
    console.log('⚠️ This is a temporary solution. Please deploy proper Firebase rules when possible.');
    
    return true;
  } else {
    console.error('❌ Firebase Firestore not found. Patch could not be applied.');
    return false;
  }
}
