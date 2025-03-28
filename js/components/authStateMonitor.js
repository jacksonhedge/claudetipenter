/**
 * Auth State Monitor
 * Watches for authentication state changes and updates UI accordingly
 * Works with both Firebase v8 and v9 APIs
 */

import { 
  showSuccessNotification,
  showErrorNotification,
  firebase,
  auth,
  db,
  onAuthStateChanged,
  getFirebaseAuth,
  getFirebaseFirestore
} from '../utils/importResolver.js';

/**
 * Check if Firebase is initialized
 * @returns {Promise<boolean>} Resolves when Firebase is initialized
 */
function checkFirebaseInitialized() {
  // If we have the promise from firebase-config.js, use it
  if (window.FIREBASE_INITIALIZED_PROMISE) {
    console.log('Using Firebase initialization promise from firebase-config.js');
    return window.FIREBASE_INITIALIZED_PROMISE;
  }
  
  // Otherwise, fall back to the polling approach
  return new Promise((resolve, reject) => {
    // First check if already initialized
    if (window.FIREBASE_INITIALIZED === true) {
      console.log('Firebase already initialized, resolving immediately');
      return resolve(true);
    }
    
    // If there was an error during initialization, reject immediately
    if (window.FIREBASE_INIT_ERROR) {
      console.error('Firebase initialization previously failed:', window.FIREBASE_INIT_ERROR);
      return reject(window.FIREBASE_INIT_ERROR);
    }
    
    console.log('Waiting for Firebase to initialize...');
    const checkInterval = setInterval(() => {
      // Check if initialized flag is set
      if (window.FIREBASE_INITIALIZED === true) {
        console.log('Firebase initialization detected');
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve(true);
        return;
      }
      
      // Also check legacy way
      if (typeof firebase !== 'undefined' && firebase.app) {
        console.log('Firebase legacy initialization detected');
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve(true);
        return;
      }
    }, 100);
    
    // Timeout after 15 seconds (increased from 10 seconds)
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      console.error('Firebase initialization timeout after 15 seconds');
      reject(new Error('Firebase initialization timeout'));
    }, 15000);
  });
}

/**
 * Initialize the auth state monitor
 * Sets up listeners for auth state changes
 */
async function initAuthStateMonitor() {
  console.log('Initializing auth state monitor...');
  
  try {
    // First, wait for Firebase to be properly initialized
    console.log('Waiting for Firebase initialization...');
    await checkFirebaseInitialized();
    console.log('Firebase initialized successfully, setting up auth state listener');
    
    // Determine which Firebase API version we're using
    const isModularAPI = typeof firebase.auth === 'undefined' || typeof firebase.auth !== 'function';
    
    if (isModularAPI) {
      // Using Firebase v9 modular API
      import("https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js")
        .then(({ onAuthStateChanged, getAuth }) => {
          const auth = getAuth();
          setupAuthStateListener(onAuthStateChanged, auth);
        })
        .catch(error => {
          console.error('Error importing Firebase Auth:', error);
          showErrorNotification('Error initializing authentication. Please refresh the page.');
        });
    } else {
      // Using Firebase v8 namespaced API
      firebase.auth().onAuthStateChanged(user => handleAuthStateChange(user));
    }
  } catch (error) {
    console.error('Firebase initialization failed or timed out:', error);
    // Don't show error notification on landing page
    if (!window.location.pathname.includes('landing.html')) {
      showErrorNotification('Authentication service initialization failed. Please refresh the page and try again.');
    }
  }
}

/**
 * Set up the auth state listener for Firebase v9
 * @param {Function} onAuthStateChanged - The Firebase auth state change function
 * @param {Object} auth - The Firebase auth instance
 */
function setupAuthStateListener(onAuthStateChanged, auth) {
  onAuthStateChanged(auth, user => handleAuthStateChange(user));
}

/**
 * Handle authentication state changes
 * @param {Object|null} user - The Firebase user object or null if signed out
 */
async function handleAuthStateChange(user) {
  if (user) {
    // User is signed in
    console.log('User is signed in:', user.email);
    
    try {
      // First, check if we already have user data in localStorage - use it if available
      const localUserRole = localStorage.getItem('user_role');
      const localUserId = localStorage.getItem('user_id');
      
      // If we already have the user data in localStorage and it matches the current user
      if (localUserRole && localUserId === user.uid) {
        console.log('Using existing user data from localStorage');
        updateUIForUserRole(localUserRole);
        
        // We still have the user signed in, so we can proceed with UI updates
        console.log('User already has data in localStorage, skipping Firestore fetch');
      } else {
        // Try to get user data from Firestore, with multiple fallbacks
        let userData = null;
        
        try {
          // Determine which Firebase API version we're using
          const isModularAPI = typeof firebase.auth === 'undefined' || typeof firebase.auth !== 'function';
          
          if (isModularAPI) {
            // Using Firebase v9 modular API
            console.log('Using Firebase v9 modular API to get user data');
            try {
              const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js");
              const firestore = getFirestore();
              const docRef = doc(firestore, 'users', user.uid);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists()) {
                userData = docSnap.data();
                console.log('Successfully retrieved user data with v9 API');
              }
            } catch (v9Err) {
              console.warn('Error with v9 API:', v9Err.message);
              // Continue to next approach
            }
          } else {
            // Using Firebase v8 namespaced API or compatibility layer
            console.log('Using Firebase v8 namespaced API to get user data');
            try {
              const docSnap = await firebase.firestore().collection('users').doc(user.uid).get();
              
              if (docSnap.exists) {
                userData = docSnap.data();
                console.log('Successfully retrieved user data with v8 API');
              }
            } catch (v8Err) {
              console.warn('Error with v8 API:', v8Err.message);
              
              // For permissions errors, try the patch approach using localStorage
              if (v8Err.message.includes('permission') || v8Err.code === 'permission-denied') {
                console.log('Permission error detected, checking localStorage for fallback data...');
                const storageKey = `tipenter_firestore_users/${user.uid}`;
                const localData = localStorage.getItem(storageKey);
                
                if (localData) {
                  try {
                    userData = JSON.parse(localData);
                    console.log('Found fallback user data in localStorage');
                  } catch (parseErr) {
                    console.warn('Error parsing localStorage data:', parseErr);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('General error retrieving user data:', error);
        }
        
        // If we still couldn't get user data, create default data
        if (!userData) {
          console.log('No user data found, creating default profile');
          // Create default userData as fallback
          userData = {
            role: 'bartender', // Default role
            displayName: user.displayName || user.email.split('@')[0],
            email: user.email,
            id: user.uid,
            createdAt: new Date().toISOString()
          };
          
          // Store in localStorage as fallback for future use
          const storageKey = `tipenter_firestore_users/${user.uid}`;
          localStorage.setItem(storageKey, JSON.stringify(userData));
          console.log('Created and stored default user profile in localStorage');
        }
        
        // Store user role in localStorage for easy access
        localStorage.setItem('user_role', userData.role);
        localStorage.setItem('user_email', user.email);
        localStorage.setItem('user_name', userData.displayName || user.displayName || '');
        localStorage.setItem('user_id', user.uid);
        
        // Update UI based on role if needed
        updateUIForUserRole(userData.role);
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    
    // Show user-specific elements
    document.querySelectorAll('.auth-required').forEach(el => {
      el.style.display = 'block';
    });
    
    // Hide login/signup buttons
    document.querySelectorAll('.auth-not-required').forEach(el => {
      el.style.display = 'none';
    });
    
    // Update header auth links
    updateAuthLinks(true);
    
  } else {
    // User is signed out
    console.log('User is signed out');
    
    // Clear user data from localStorage
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    
    // Check if on a protected page
    checkProtectedPage();
    
    // Hide user-specific elements
    document.querySelectorAll('.auth-required').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show login/signup buttons
    document.querySelectorAll('.auth-not-required').forEach(el => {
      el.style.display = 'block';
    });
    
    // Update header auth links
    updateAuthLinks(false);
  }
}

/**
 * Update the header auth links based on authentication state
 * @param {boolean} isAuthenticated - Whether a user is authenticated
 */
function updateAuthLinks(isAuthenticated) {
  const authLink = document.getElementById('authLink');
  const authLinkSidebar = document.getElementById('authLinkSidebar');
  
  if (isAuthenticated) {
    // User is signed in, change links to profile/logout
    if (authLink) {
      authLink.textContent = 'My Account';
      authLink.href = '#'; // We'll handle this with the profileBtn
      
      // Profile button shows the modal, so we'll just open that
      authLink.addEventListener('click', (e) => {
        e.preventDefault();
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
          profileBtn.click();
        }
      });
    }
    
    if (authLinkSidebar) {
      authLinkSidebar.innerHTML = '<i class="fas fa-user-circle"></i> My Account';
      authLinkSidebar.href = '#';
      
      // Open profile modal when clicked
      authLinkSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
          profileBtn.click();
        }
        
        // Also close sidebar
        const closeSidebarBtn = document.querySelector('.close-sidebar');
        if (closeSidebarBtn) {
          closeSidebarBtn.click();
        }
      });
    }
  } else {
    // User is signed out, reset links to login
    if (authLink) {
      authLink.textContent = 'Login';
      authLink.href = 'login.html';
      
      // Clear any click event listeners
      authLink.replaceWith(authLink.cloneNode(true));
    }
    
    if (authLinkSidebar) {
      authLinkSidebar.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      authLinkSidebar.href = 'login.html';
      
      // Clear any click event listeners
      authLinkSidebar.replaceWith(authLinkSidebar.cloneNode(true));
    }
  }
}

/**
 * Check if the current page is protected and redirect if needed
 */
function checkProtectedPage() {
  // Check if we're in a transition or have flags to prevent redirect
  if (sessionStorage.getItem('auth_transition') === 'true' || 
      sessionStorage.getItem('prevent_redirect') === 'true' ||
      localStorage.getItem('disable_redirect') === 'true') {
    console.log('Auth transition or redirect prevention detected, skipping protected page check');
    return;
  }

  // Check if we have user data in localStorage as fallback
  const localUserId = localStorage.getItem('user_id');
  const localUserRole = localStorage.getItem('user_role');
  
  if (localUserId && localUserRole) {
    console.log('User data found in localStorage, not redirecting');
    return;
  }
  
  const protectedPages = ['home.html', 'admin.html', 'profile.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage)) {
    console.log('Protected page detected, redirecting to login');
    // Redirect to login page
    window.location.href = 'login.html';
  }
}

/**
 * Update UI elements based on user role
 * @param {string} role - The user's role
 */
function updateUIForUserRole(role) {
  // Additional UI updates based on role
  if (role === 'manager') {
    // Manager/Business specific UI changes
    document.querySelectorAll('.manager-only').forEach(el => {
      el.style.display = 'block';
    });
    
    document.querySelectorAll('.bartender-only').forEach(el => {
      el.style.display = 'none';
    });
  } else {
    // Bartender specific UI changes
    document.querySelectorAll('.manager-only').forEach(el => {
      el.style.display = 'none';
    });
    
    document.querySelectorAll('.bartender-only').forEach(el => {
      el.style.display = 'block';
    });
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initAuthStateMonitor);

export { 
  initAuthStateMonitor,
  handleAuthStateChange
};
