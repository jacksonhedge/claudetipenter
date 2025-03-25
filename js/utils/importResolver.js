/**
 * Import Resolver
 * Centralizes and resolves imports across the application
 * 
 * This file handles both static and dynamic imports for Firebase services
 * and provides fallbacks for error cases.
 */

// Import common application utilities
import { showSuccessNotification, showErrorNotification } from './notificationUtils.js';
import { applyFirestorePatch } from './firestorePatch.js';

// Import Firebase configuration - using try/catch to handle potential errors
let firebase, auth, db, storage;
let createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged;

try {
  // Attempt to import from firebase-config.js
  const firebaseImport = await import('../firebase-config.js');
  
  // Assign imported values
  firebase = firebaseImport.firebase;
  auth = firebaseImport.auth;
  db = firebaseImport.db;
  storage = firebaseImport.storage;
  createUserWithEmailAndPassword = firebaseImport.createUserWithEmailAndPassword;
  signInWithEmailAndPassword = firebaseImport.signInWithEmailAndPassword;
  signOut = firebaseImport.signOut;
  onAuthStateChanged = firebaseImport.onAuthStateChanged;
  
  console.log('✅ Firebase imports loaded via firebase-config.js');
} catch (error) {
  console.error('❌ Error importing Firebase services from firebase-config.js:', error);
  
  // Initialize with null values so the app can still run
  firebase = null;
  auth = null;
  db = null;
  storage = null;
  createUserWithEmailAndPassword = () => Promise.reject(new Error('Firebase not initialized'));
  signInWithEmailAndPassword = () => Promise.reject(new Error('Firebase not initialized'));
  signOut = () => Promise.reject(new Error('Firebase not initialized'));
  onAuthStateChanged = () => () => {}; // Returns a function that does nothing (unsubscribe)
}

// Cached module imports to prevent repeated loading
let firebaseAuthModule = null;
let firebaseFirestoreModule = null;

// Dynamic import for Firebase Auth (v9) with error handling and caching
export async function getFirebaseAuth() {
  try {
    if (firebaseAuthModule) {
      return firebaseAuthModule;
    }
    
    firebaseAuthModule = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js");
    console.log('✅ Firebase Auth modules loaded dynamically');
    return firebaseAuthModule;
  } catch (error) {
    console.error('❌ Error loading Firebase Auth modules:', error);
    
    // Return a mock object that won't break code
    return {
      signInWithPopup: () => Promise.reject(new Error('Firebase Auth not available')),
      GoogleAuthProvider: function() {
        this.addScope = () => {};
        this.setCustomParameters = () => {};
        return this;
      },
      credentialFromResult: () => null
    };
  }
}

// Dynamic import for Firebase Firestore (v9) with error handling and caching
export async function getFirebaseFirestore() {
  try {
    if (firebaseFirestoreModule) {
      return firebaseFirestoreModule;
    }
    
    firebaseFirestoreModule = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
    console.log('✅ Firebase Firestore modules loaded dynamically');
    return firebaseFirestoreModule;
  } catch (error) {
    console.error('❌ Error loading Firebase Firestore modules:', error);
    
    // Return a mock object that won't break code
    return {
      getFirestore: () => ({}),
      collection: () => ({}),
      doc: () => ({}),
      getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
      setDoc: () => Promise.resolve({}),
      updateDoc: () => Promise.resolve({}),
      deleteDoc: () => Promise.resolve({}),
      query: () => ({}),
      where: () => ({}),
      limit: () => ({}),
      orderBy: () => ({}),
      getDocs: () => Promise.resolve({ empty: true, docs: [], forEach: () => {} })
    };
  }
}

// Export all modules - including potentially null values which are handled with fallbacks
export {
  // Notifications
  showSuccessNotification,
  showErrorNotification,
  
  // Firebase patch
  applyFirestorePatch,
  
  // Firebase core
  firebase,
  auth,
  db,
  storage,
  
  // Firebase Auth
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
