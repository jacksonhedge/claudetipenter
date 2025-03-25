/**
 * Firebase Authentication Providers
 * This file exports authentication providers for use with Firebase Auth
 * Supports both modular v9 and namespaced v8 Firebase APIs
 */

import { 
  auth, 
  db, 
  firebase,
  showSuccessNotification, 
  showErrorNotification,
  getFirebaseAuth,
  getFirebaseFirestore
} from './utils/importResolver.js';
import { showRoleSelectionModal } from './components/roleSelectionModal.js';

// Check if using namespaced API (v8) or modular API (v9)
// Make sure to check auth exists before accessing properties
const isModularAPI = typeof auth !== 'undefined' && auth !== null && 
                     typeof auth !== 'function' && 
                     (typeof auth.signInWithPopup === 'function' || auth.currentUser !== undefined);

// Create Google Auth Provider
let googleProvider = null;

// We'll initialize the provider when needed in the signInWithGoogle function
// instead of trying to create it at module load time

// Google sign-in function that works with both v8 and v9 Firebase
const signInWithGoogle = async (e) => {
  try {
    // Make sure Firebase is initialized
    // Wait a bit to make sure Firebase is fully loaded
    await new Promise(resolve => setTimeout(resolve, 500));

    let result;
    
    if (isModularAPI) {
      try {
        // Using v9 modular API
        const firebaseAuth = await getFirebaseAuth();
        const { signInWithPopup, GoogleAuthProvider } = firebaseAuth;
        
        // Initialize the provider right before using it
        googleProvider = new GoogleAuthProvider();
        googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        
        // Sign in with popup
        result = await signInWithPopup(auth, googleProvider);
      } catch (error) {
        console.error("Error with v9 API, falling back to v8:", error);
        // If the v9 approach fails, try the v8 approach as a fallback
        // Initialize the provider right before using it
        googleProvider = firebase.auth.GoogleAuthProvider ? new firebase.auth.GoogleAuthProvider() : null;
        
        if (!googleProvider) {
          throw new Error("Firebase Auth not initialized. Please try again in a few moments.");
        }
        
        googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        googleProvider.setCustomParameters({
          'login_hint': 'user@example.com'
        });
        
        result = await firebase.auth().signInWithPopup(googleProvider);
      }
    } else {
      // Using v8 namespaced API
      // Check if firebase.auth is actually available
      if (!firebase.auth || typeof firebase.auth !== 'function') {
        throw new Error("Firebase Auth not initialized. Please try again in a few moments.");
      }
      
      // Initialize the provider right before using it
      googleProvider = new firebase.auth.GoogleAuthProvider();
      googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
      googleProvider.setCustomParameters({
        'login_hint': 'user@example.com'
      });
      
      result = await firebase.auth().signInWithPopup(googleProvider);
    }
    
    // Get user and other information
    const user = result.user;
    const isNewUser = result.additionalUserInfo?.isNewUser || false;
    
    let token = null;
    let credential = null;
    
    // Get credential and token based on API version
    if (isModularAPI) {
      const firebaseAuth = await getFirebaseAuth();
      const { GoogleAuthProvider } = firebaseAuth;
      credential = GoogleAuthProvider.credentialFromResult(result);
      token = credential?.accessToken;
    } else {
      credential = result.credential;
      token = credential?.accessToken;
    }
    
    // Handle user creation and role selection
    if (isNewUser) {
      // Show role selection modal for new users
      showRoleSelectionModal(user, (selectedRole) => {
        // After role is selected and user is created, redirect
        showSuccessNotification('Account created successfully!');
        
        // Redirect to appropriate page based on role after a delay
        setTimeout(() => {
          if (selectedRole === 'manager') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'home.html';
          }
        }, 1500);
      });
    } else {
      // For existing users, get their record and redirect
      try {
        let userData;
        
        if (isModularAPI) {
          const firestore = await getFirebaseFirestore();
          const { getDoc, doc } = firestore;
          const docSnapshot = await getDoc(doc(db, 'users', user.uid));
          if (docSnapshot.exists()) {
            userData = docSnapshot.data();
          }
        } else {
          const docSnapshot = await firebase.firestore().collection('users').doc(user.uid).get();
          if (docSnapshot.exists) {
            userData = docSnapshot.data();
          }
        }
        
        if (userData) {
          showSuccessNotification('Successfully logged in!');
          
          // Redirect based on user role
          setTimeout(() => {
            if (userData.role === 'manager') {
              window.location.href = 'admin.html';
            } else {
              window.location.href = 'home.html';
            }
          }, 1500);
        } else {
          // User exists in Authentication but not in Firestore
          // Show role selection modal
          showRoleSelectionModal(user);
        }
      } catch (error) {
        console.error("Error getting user document:", error);
        showErrorNotification('Error retrieving user profile');
        throw error;
      }
    }
    
    return {
      success: true,
      user,
      token,
      isNewUser,
      credential,
      additionalUserInfo: result.additionalUserInfo
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    
    // Create standardized error object
    const errorData = {
      error,
      errorCode: error.code || 'unknown-error',
      errorMessage: error.message || 'An unknown error occurred during authentication',
      email: error.email || error.customData?.email || null,
      credential: null
    };
    
    throw errorData;
  }
};

export {
  googleProvider,
  signInWithGoogle
};
