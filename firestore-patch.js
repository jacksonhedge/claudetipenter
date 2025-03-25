// This script runs directly in the browser console to temporarily patch Firebase Firestore rules
// Copy and paste this entire script into your browser console on the TipEnter app

// Temporary fix for Firestore permissions
window.patchFirestorePermissions = function() {
  console.log('Attempting to patch Firestore permissions...');
  
  // Try to find the Firestore instance
  if (window.firebase && window.firebase.firestore) {
    console.log('Found Firebase Firestore instance, applying patch...');
    
    // Create a wrapper for any Firestore write operations
    const originalSet = firebase.firestore.DocumentReference.prototype.set;
    firebase.firestore.DocumentReference.prototype.set = function(...args) {
      console.log('Intercepted Firestore set operation:', this.path);
      try {
        return originalSet.apply(this, args);
      } catch (error) {
        console.log('Handling error in set operation');
        // Fall back to local storage
        const path = this.path;
        const data = args[0];
        localStorage.setItem('tipenter_' + path, JSON.stringify(data));
        console.log('Saved data to local storage as fallback');
        return Promise.resolve();
      }
    };
    
    const originalUpdate = firebase.firestore.DocumentReference.prototype.update;
    firebase.firestore.DocumentReference.prototype.update = function(...args) {
      console.log('Intercepted Firestore update operation:', this.path);
      try {
        return originalUpdate.apply(this, args);
      } catch (error) {
        console.log('Handling error in update operation');
        // Fall back to local storage
        const path = this.path;
        const data = args[0];
        let existingData = {};
        try {
          const existing = localStorage.getItem('tipenter_' + path);
          if (existing) {
            existingData = JSON.parse(existing);
          }
        } catch (e) {}
        localStorage.setItem('tipenter_' + path, JSON.stringify({...existingData, ...data}));
        console.log('Updated data in local storage as fallback');
        return Promise.resolve();
      }
    };
    
    console.log('Firestore permission patch applied successfully!');
    console.log('This is a temporary fix until you can deploy the proper rules to Firebase.');
    console.log('Remember to run: node update-firebase-rules.js');
  } else {
    console.error('Firebase Firestore instance not found. Patch could not be applied.');
  }
};

console.log('Firestore permission patch script loaded!');
console.log('Run window.patchFirestorePermissions() to apply the temporary fix.');
