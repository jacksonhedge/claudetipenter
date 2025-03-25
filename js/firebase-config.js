/**
 * Firebase Configuration
 * This file contains the Firebase configuration and initialization
 */

// Check if we're on the landing page and skip Firebase initialization if so
const isLandingPage = window.location.pathname.includes('landing.html') || window.location.pathname.endsWith('/');

// Set flag to indicate Firebase is loading
window.FIREBASE_LOADING = true;

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2iNWpaTSv_SqDBTpSTaSRdpONLuF9t7o",
  authDomain: "tipscanner-46c53.firebaseapp.com",
  projectId: "tipscanner-46c53",
  storageBucket: "tipscanner-46c53.appspot.com",
  messagingSenderId: "1028385682352",
  appId: "1:1028385682352:web:189827eae20a7f34509c75",
  measurementId: "G-P9F9206BFL"
};

// Initialize Firebase with more consistent handling
let app, auth, db, analytics, storage;

// Create a promise that resolves when Firebase is initialized
window.FIREBASE_INITIALIZED_PROMISE = new Promise((resolve, reject) => {
  try {
    if (!isLandingPage) {
      console.log('Initializing Firebase...');
      
      // Initialize Firebase with a delay to ensure all modules are loaded properly
      setTimeout(() => {
        try {
          app = initializeApp(firebaseConfig);
          auth = getAuth(app);
          db = getFirestore(app);
          // Initialize storage with explicit bucket URL
          storage = getStorage(app);
          // Verify storage bucket URL
          console.log(`Firebase Storage bucket: ${firebaseConfig.storageBucket}`);
          console.log(`Storage URL: gs://${firebaseConfig.storageBucket}`);
          analytics = getAnalytics(app);
          
          // Set global flag indicating Firebase is initialized
          window.FIREBASE_INITIALIZED = true;
          window.FIREBASE_LOADING = false;
          
          console.log('Firebase initialization complete');
          resolve(true);
        } catch (initError) {
          console.error('Firebase initialization error during delayed init:', initError);
          window.FIREBASE_LOADING = false;
          window.FIREBASE_INIT_ERROR = initError;
          reject(initError);
        }
      }, 500); // Short delay to ensure modules are loaded
    } else {
      console.log('Landing page detected, using mock Firebase');
      // Create mock objects for Firebase services
      app = {};
      auth = {
        currentUser: null,
        onAuthStateChanged: (callback) => {
          callback(null);
          return () => {};
        },
        signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'demo-uid', email: 'demo@example.com' } }),
        createUserWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'demo-uid', email: 'demo@example.com' } }),
        signOut: () => Promise.resolve()
      };
      db = {
        collection: () => ({ doc: () => ({}) }),
        doc: () => ({}),
        getDoc: () => Promise.resolve({ exists: () => false }),
        setDoc: () => Promise.resolve(),
        updateDoc: () => Promise.resolve(),
        query: () => ({}),
        where: () => ({}),
        getDocs: () => Promise.resolve({ forEach: () => {} }),
        addDoc: () => Promise.resolve(),
        deleteDoc: () => Promise.resolve()
      };
      analytics = {};
      storage = {};
      
      // Set global flag indicating Firebase mock is initialized
      window.FIREBASE_INITIALIZED = true;
      window.FIREBASE_LOADING = false;
      
      resolve(true);
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Fallback to mock objects if Firebase initialization fails
    app = {};
    auth = {
      currentUser: null,
      onAuthStateChanged: (callback) => {
        callback(null);
        return () => {};
      },
      signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'demo-uid', email: 'demo@example.com' } }),
      createUserWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'demo-uid', email: 'demo@example.com' } }),
      signOut: () => Promise.resolve()
    };
    db = {
      collection: () => ({ doc: () => ({}) }),
      doc: () => ({}),
      getDoc: () => Promise.resolve({ exists: () => false }),
      setDoc: () => Promise.resolve(),
      updateDoc: () => Promise.resolve(),
      query: () => ({}),
      where: () => ({}),
      getDocs: () => Promise.resolve({ forEach: () => {} }),
      addDoc: () => Promise.resolve(),
      deleteDoc: () => Promise.resolve()
    };
    analytics = {};
    storage = {};
    
    window.FIREBASE_LOADING = false;
    window.FIREBASE_INIT_ERROR = error;
    
    reject(error);
  }
});

// Initialize auth immediately with safe defaults in case the async initialization fails
// This ensures auth is never undefined
auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    callback(null);
    return () => {};
  },
  signInWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'demo-uid', email: 'demo@example.com' } }),
  createUserWithEmailAndPassword: () => Promise.resolve({ user: { uid: 'demo-uid', email: 'demo@example.com' } }),
  signOut: () => Promise.resolve()
};

// Create compatibility layer for older Firebase syntax
// This allows code using the older namespaced API to work alongside modern modular imports
let firebase = window.firebase || {};

if (!window.firebase) {
  // Create a firebase namespace object if it doesn't exist
  firebase = {
    // These functions return references to the initialized services
    initializeApp: () => app,
    auth: () => auth,
    firestore: () => {
      // Enhanced firestore compatibility layer
      return {
        ...db,
        collection: (collectionPath) => {
          console.log(`Using enhanced firestore compatibility layer for collection: ${collectionPath}`);
          return {
            doc: (docId) => {
              console.log(`Using enhanced firestore compatibility layer for doc: ${docId}`);
              return {
                get: async () => {
                  console.log(`Getting document: ${collectionPath}/${docId}`);
                  try {
                    // Try using imported functions
                    const docRef = doc(db, collectionPath, docId);
                    const docSnap = await getDoc(docRef);
                    
                    return {
                      exists: docSnap.exists(),
                      data: () => docSnap.data(),
                      id: docId,
                      ref: { path: `${collectionPath}/${docId}` }
                    };
                  } catch (error) {
                    console.error(`Error getting document ${collectionPath}/${docId}:`, error);
                    throw error;
                  }
                },
                set: async (data, options) => {
                  console.log(`Setting document: ${collectionPath}/${docId}`);
                  const docRef = doc(db, collectionPath, docId);
                  return setDoc(docRef, data, options);
                },
                update: async (data) => {
                  console.log(`Updating document: ${collectionPath}/${docId}`);
                  const docRef = doc(db, collectionPath, docId);
                  return updateDoc(docRef, data);
                },
                path: `${collectionPath}/${docId}`
              };
            },
            where: (field, op, value) => {
              console.log(`Using enhanced firestore compatibility layer for where: ${field} ${op} ${value}`);
              return {
                get: async () => {
                  const q = query(collection(db, collectionPath), where(field, op, value));
                  const querySnapshot = await getDocs(q);
                  
                  const docs = [];
                  querySnapshot.forEach((doc) => {
                    docs.push({
                      id: doc.id,
                      exists: true,
                      data: () => doc.data(),
                      ref: { path: `${collectionPath}/${doc.id}` }
                    });
                  });
                  
                  return {
                    empty: docs.length === 0,
                    forEach: (callback) => docs.forEach(callback),
                    docs: docs
                  };
                }
              };
            },
            add: async (data) => {
              console.log(`Adding document to collection: ${collectionPath}`);
              const collectionRef = collection(db, collectionPath);
              return addDoc(collectionRef, data);
            },
            get: async () => {
              console.log(`Getting all documents in collection: ${collectionPath}`);
              const querySnapshot = await getDocs(collection(db, collectionPath));
              
              const docs = [];
              querySnapshot.forEach((doc) => {
                docs.push({
                  id: doc.id,
                  exists: true,
                  data: () => doc.data(),
                  ref: { path: `${collectionPath}/${doc.id}` }
                });
              });
              
              return {
                empty: docs.length === 0,
                forEach: (callback) => docs.forEach(callback),
                docs: docs
              };
            }
          };
        }
      };
    },
    storage: () => storage,
    analytics: () => analytics,
    app: app  // Add the app reference directly as well
  };

  // Expose Firebase auth provider for Google authentication
  if (typeof GoogleAuthProvider !== 'undefined') {
    firebase.auth.GoogleAuthProvider = GoogleAuthProvider;
  }

  // Add to window object for global access
  window.firebase = firebase;
}

export { 
  app, 
  auth, 
  db, 
  analytics, 
  storage,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  // Export the compatibility layer
  firebase
};
