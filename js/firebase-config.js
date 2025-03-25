/**
 * Firebase Configuration
 * This file contains the Firebase configuration and initialization
 */

// Check if we're on the landing page and skip Firebase initialization if so
const isLandingPage = window.location.pathname.includes('landing.html') || window.location.pathname.endsWith('/');

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
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

// Initialize Firebase only if not on landing page
let app, auth, db, analytics;

if (!isLandingPage) {
  console.log('Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  analytics = getAnalytics(app);
} else {
  console.log('Landing page detected, skipping Firebase initialization');
  // Create mock objects for Firebase services
  app = {};
  auth = {
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    },
    signInWithEmailAndPassword: () => Promise.resolve({}),
    createUserWithEmailAndPassword: () => Promise.resolve({}),
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
}

export { app, auth, db, analytics, 
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
  deleteDoc
};
