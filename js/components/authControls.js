/**
 * Authentication Controls
 * Handles common authentication UI interactions like sign out
 */

import { showSuccessNotification, showErrorNotification } from '../utils/notificationUtils.js';
import { firebase } from '../firebase-config.js';

/**
 * Initialize authentication controls and event listeners
 */
export function initAuthControls() {
  // Find sign out button(s)
  const signOutButtons = document.querySelectorAll('#signOutBtn, .sign-out-btn, [data-action="sign-out"]');
  
  if (signOutButtons.length === 0) {
    console.log('No sign out buttons found on this page');
    return;
  }
  
  console.log(`Found ${signOutButtons.length} sign out button(s)`);
  
  // Add event listeners to all sign out buttons
  signOutButtons.forEach(button => {
    button.addEventListener('click', handleSignOut);
  });
}

/**
 * Handle sign out action
 * Works with both Firebase v8 (namespaced) and v9 (modular) APIs
 * @param {Event} e - The click event
 */
async function handleSignOut(e) {
  try {
    // Determine which Firebase API version we're using
    const isModularAPI = typeof firebase.auth === 'undefined' || typeof firebase.auth !== 'function';
    
    if (isModularAPI) {
      // Using Firebase v9 modular API
      const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js");
      const auth = getAuth();
      await signOut(auth);
    } else {
      // Using Firebase v8 namespaced API
      await firebase.auth().signOut();
    }
    
    // Sign-out successful
    showSuccessNotification('Successfully signed out!');
    
    // Redirect to login page after a short delay
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
  } catch (error) {
    // An error happened
    console.error('Sign out error:', error);
    showErrorNotification('Failed to sign out. Please try again.');
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initAuthControls);

// Export functions for direct use
export {
  handleSignOut
};
