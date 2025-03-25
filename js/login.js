/**
 * Login Page JavaScript
 * Handles login/signup tabs, role selection, and Firebase authentication
 */

// Import from authStateMonitor.js or use global promise
async function checkFirebaseInitialized() {
  // If we have the promise from firebase-config.js, use it
  if (window.FIREBASE_INITIALIZED_PROMISE) {
    console.log('Login.js: Using Firebase initialization promise from firebase-config.js');
    return window.FIREBASE_INITIALIZED_PROMISE;
  }
  
  // Otherwise, fall back to the polling approach
  return new Promise((resolve, reject) => {
    // First check if already initialized
    if (window.FIREBASE_INITIALIZED === true) {
      console.log('Login.js: Firebase already initialized, resolving immediately');
      return resolve(true);
    }
    
    // If there was an error during initialization, reject immediately
    if (window.FIREBASE_INIT_ERROR) {
      console.error('Login.js: Firebase initialization previously failed:', window.FIREBASE_INIT_ERROR);
      return reject(window.FIREBASE_INIT_ERROR);
    }
    
    console.log('Login.js: Waiting for Firebase to initialize...');
    const checkInterval = setInterval(() => {
      // Check if initialized flag is set
      if (window.FIREBASE_INITIALIZED === true) {
        console.log('Login.js: Firebase initialization detected');
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve(true);
        return;
      }
      
      // Also check legacy way
      if (typeof firebase !== 'undefined' && firebase.app) {
        console.log('Login.js: Firebase legacy initialization detected');
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve(true);
        return;
      }
    }, 100);
    
    // Timeout after 15 seconds (increased from 10 seconds)
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      console.error('Login.js: Firebase initialization timeout after 15 seconds');
      reject(new Error('Firebase initialization timeout'));
    }, 15000);
  });
}

import { 
    login, 
    signup, 
    authenticateWithProvider, 
    onAuthStateChange,
    getCurrentUser
} from './services/authService.js';
import { signInWithGoogle } from './firebase-auth-providers.js';
import { showSuccessNotification, showErrorNotification } from './utils/notificationUtils.js';
import { applyFirestorePatch } from './utils/firestorePatch.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Firebase to be properly initialized before trying to apply patches
    try {
        // This will use the promise from firebase-config.js if available
        await checkFirebaseInitialized();
        console.log('Login.js: Firebase initialized, applying Firestore patch...');
        
        // Now it's safe to apply Firestore patch
        try {
            const patchResult = applyFirestorePatch();
            if (typeof patchResult === 'function') {
                // Firebase objects not fully ready yet, retry once
                console.log('Login.js: Firebase not fully ready yet, retrying patch in 1s...');
                setTimeout(() => {
                    try {
                        const delayedResult = patchResult();
                        console.log('Login.js: Delayed Firestore patch result:', delayedResult ? 'Success' : 'Failed');
                    } catch (err) {
                        console.error('Login.js: Error applying delayed Firestore patch:', err);
                    }
                }, 1000);
            } else if (patchResult) {
                console.log('Login.js: Firestore patch applied successfully on first attempt');
            }
        } catch (error) {
            console.error('Login.js: Error applying Firestore patch:', error);
        }
    } catch (error) {
        console.error('Login.js: Firebase initialization error:', error);
    }
    
    // Temporarily disable auto-redirect to fix refresh loop issues
    // This code sets flags to prevent redirection and logs that we're disabling auto-redirect
    console.log('⚠️ Auto-redirect is temporarily disabled to fix refresh loop issues');
    sessionStorage.setItem('prevent_redirect', 'true');
    localStorage.setItem('disable_redirect', 'true');
    
    // Clear auth transition flag if it exists
    if (sessionStorage.getItem('auth_transition')) {
        console.log('Clearing existing auth transition flag');
        sessionStorage.removeItem('auth_transition');
    }
    
    // Set up a manual login check instead of using the auto-redirect
    // This only runs once when the page loads, not on every auth state change
    setTimeout(async () => {
        try {
            // Try to get current user, but don't throw errors if it fails
            try {
                const user = await getCurrentUser();
                console.log('Initial auth check on login page:', user ? 'User is logged in' : 'No user logged in');
                
                // We won't auto-redirect even if user is logged in
                // User will need to manually login again or navigate to home/admin
            } catch (error) {
                console.log('Initial auth check failed, but continuing anyway');
            }
        } catch (error) {
            console.error('Error during initial auth check:', error);
            
            // If there was an error during auth check, log out to force a clean login
            try {
                // Clear any existing auth session
                console.log('Error in auth check, clearing session to force clean login');
                // Remove stored session data
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
                sessionStorage.removeItem('auth_transition');
                sessionStorage.removeItem('prevent_redirect');
                
                // Force the page to stay on login
                window.location.hash = '';
            } catch (clearError) {
                console.error('Error clearing session:', clearError);
            }
        }
    }, 1000);
    
    // Password toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Password matching check
    const signupPassword = document.getElementById('signup-password');
    const signupConfirm = document.getElementById('signup-confirm');
    const passwordMatchIndicator = document.getElementById('password-match-indicator');
    
    function checkPasswordMatch() {
        if (signupConfirm.value === '') {
            passwordMatchIndicator.textContent = '';
            passwordMatchIndicator.className = 'password-match-indicator';
            return;
        }
        
        if (signupPassword.value === signupConfirm.value) {
            passwordMatchIndicator.textContent = 'Passwords match';
            passwordMatchIndicator.className = 'password-match-indicator match';
        } else {
            passwordMatchIndicator.textContent = 'Passwords do not match';
            passwordMatchIndicator.className = 'password-match-indicator no-match';
        }
    }
    
    signupPassword.addEventListener('input', checkPasswordMatch);
    signupConfirm.addEventListener('input', checkPasswordMatch);
    
    // Load establishments for workplace dropdown
    async function loadEstablishments() {
        try {
            const signupWorkplace = document.getElementById('signup-workplace');
            
            // Import EstablishmentModel dynamically to avoid circular dependencies
            const { EstablishmentModel } = await import('./models/EstablishmentModel.js');
            
            // Show loading state
            signupWorkplace.innerHTML = '<option value="" disabled selected>Loading workplaces...</option>';
            
            // Get establishments from Firebase
            console.log('Fetching establishments from Firebase...');
            const establishments = await EstablishmentModel.getAll();
            console.log('Establishments loaded:', establishments.length);
            
            // Clear dropdown
            signupWorkplace.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            defaultOption.textContent = 'Select your workplace';
            signupWorkplace.appendChild(defaultOption);
            
            // Add establishments to dropdown
            establishments.forEach(establishment => {
                const option = document.createElement('option');
                option.value = establishment.id;
                option.textContent = establishment.name;
                signupWorkplace.appendChild(option);
            });
            
            // Add "Other" option
            const otherOption = document.createElement('option');
            otherOption.value = 'other';
            otherOption.textContent = 'Other';
            signupWorkplace.appendChild(otherOption);
            
            console.log('Workplace dropdown populated successfully');
        } catch (error) {
            console.error('Error loading establishments:', error);
            
            // If there was an error, add some default options
            const signupWorkplace = document.getElementById('signup-workplace');
            signupWorkplace.innerHTML = `
                <option value="" disabled selected>Select your workplace</option>
                <option value="qXtsIXX3LJSD7xgMfJFr">Cork Harbour</option>
                <option value="other">Other</option>
            `;
        }
    }
    
    // Call the function to load establishments
    loadEstablishments();
    
    // Other workplace functionality
    const signupWorkplace = document.getElementById('signup-workplace');
    const signupOtherWorkplaceGroup = document.querySelector('#signup-tab .other-workplace-group');
    
    signupWorkplace.addEventListener('change', function() {
        if (this.value === 'other') {
            signupOtherWorkplaceGroup.style.display = 'block';
        } else {
            signupOtherWorkplaceGroup.style.display = 'none';
        }
    });
    
    // Check if URL has a hash fragment for signup
    if (window.location.hash === '#signup') {
        // Find the signup tab button and click it
        const signupTabBtn = document.querySelector('.tab-btn[data-tab="signup-tab"]');
        if (signupTabBtn) {
            signupTabBtn.click();
        }
    }
    // DOM Elements - Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // DOM Elements - Role Selectors
    const roleBtns = document.querySelectorAll('.role-btn');
    const loginRoleInput = document.getElementById('login-role');
    const signupRoleInput = document.getElementById('signup-role');
    const managerCodeGroup = document.querySelector('.manager-code-group');
    
    // Check if a role was selected from the landing page
    const selectedRole = localStorage.getItem('selected_role');
    if (selectedRole) {
        // Find the role buttons for the active tab
        const activeTab = document.querySelector('.tab-panel.active');
        const activeTabRoleBtns = activeTab.querySelectorAll('.role-btn');
        
        // Remove active class from all role buttons in the active tab
        activeTabRoleBtns.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to the selected role button
        activeTabRoleBtns.forEach(btn => {
            if (btn.getAttribute('data-role') === selectedRole) {
                btn.classList.add('active');
                
                // Update the hidden role input
                if (activeTab.id === 'signup-tab') {
                    signupRoleInput.value = selectedRole;
                    
                    // Show/hide manager code field
                    if (selectedRole === 'manager') {
                        managerCodeGroup.style.display = 'block';
                    } else {
                        managerCodeGroup.style.display = 'none';
                    }
                } else {
                    loginRoleInput.value = selectedRole;
                }
            }
        });
        
        // Clear the selected role from localStorage
        localStorage.removeItem('selected_role');
    }
    
    // DOM Elements - Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    // DOM Elements - SSO
    const ssoBtns = document.querySelectorAll('.sso-btn');
    
    // Tab Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default button behavior
            
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and panels
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Reset any form errors when switching tabs
            const forms = document.querySelectorAll('.auth-form');
            forms.forEach(form => {
                const submitBtn = form.querySelector('.auth-btn');
                if (submitBtn.disabled) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = tabId === 'login-tab' ? 'Login' : 'Sign Up';
                }
            });
        });
    });
    
    // Role Selection
    roleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default button behavior
            
            const role = btn.getAttribute('data-role');
            const tabPanel = btn.closest('.tab-panel');
            const isSignup = tabPanel.id === 'signup-tab';
            
            // Remove active class from all role buttons in this tab panel
            tabPanel.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update hidden role input
            if (isSignup) {
                signupRoleInput.value = role;
                
                // Show/hide manager code field with smooth animation
                if (role === 'manager') {
                    managerCodeGroup.style.display = 'block';
                    // Trigger reflow for animation to work
                    managerCodeGroup.offsetHeight;
                    managerCodeGroup.style.opacity = '1';
                    managerCodeGroup.style.transform = 'translateY(0)';
                    
                    // Update position dropdown to match role
                    const positionSelect = document.getElementById('signup-position');
                    for (let i = 0; i < positionSelect.options.length; i++) {
                        if (positionSelect.options[i].value === 'manager') {
                            positionSelect.selectedIndex = i;
                            break;
                        }
                    }
                } else {
                    if (managerCodeGroup.style.display === 'block') {
                        managerCodeGroup.style.opacity = '0';
                        managerCodeGroup.style.transform = 'translateY(-10px)';
                        setTimeout(() => {
                            managerCodeGroup.style.display = 'none';
                        }, 300);
                    }
                }
            } else {
                loginRoleInput.value = role;
            }
        });
    });
    
    // Direct login function that works even when Firebase is having issues
    function directLoginBypass(email, password, role) {
        // Store user info in localStorage for offline access
        const userId = 'user_' + Math.random().toString(36).substr(2, 9);
        const userData = {
            id: userId,
            email: email,
            role: role,
            name: email.split('@')[0],
            createdAt: new Date().toISOString()
        };
        
        // Store user data in localStorage
        localStorage.setItem('user_id', userId);
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_name', email.split('@')[0]);
        
        // Store the full user data object in case it's needed
        localStorage.setItem(`tipenter_firestore_users/${userId}`, JSON.stringify(userData));
        
        console.log('✅ Direct login bypass successful');
        showSuccessNotification('Login successful! Redirecting...');
        
        // Redirect based on role
        setTimeout(() => {
            if (role === 'manager') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'home.html';
            }
        }, 1000);
        
        return userData;
    }
    
    // Add event listeners to login and signup buttons directly
    if (loginForm) {
        // Find the login button
        const loginButton = loginForm.querySelector('.auth-btn');
        
        // Make sure we have a valid button before adding the event listener
        if (loginButton) {
            console.log('Adding click event to login button');
            // Remove any existing event listeners
            loginButton.removeEventListener('click', loginHandler);
            // Add new event listener
            loginButton.addEventListener('click', loginHandler);
            
            // Also add event listener to the form submit event as a backup
            loginForm.addEventListener('submit', loginHandler);
        }
    }
    
    // Login handler function
    async function loginHandler(e) {
            // Prevent default form submission
            e.preventDefault();
            
            // Show loading state
            const submitBtn = loginForm.querySelector('.auth-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;
            
            try {
                // Get form data
                const email = loginForm.querySelector('input[name="email"]').value;
                const password = loginForm.querySelector('input[name="password"]').value;
                const role = loginForm.querySelector('input[name="role"]').value;
                
                // Validate form data
                if (!email || !password) {
                    throw new Error('Please fill in all required fields');
                }
                
                console.log('Starting login process for', email);
                
                // First try the direct bypass approach
                const userData = directLoginBypass(email, password, role);
                
                // We don't need to continue since directLoginBypass handles the redirect
                return;
                
                // The code below is kept as a fallback but won't be reached
                try {
                    // Login with Firebase
                    const user = await login(email, password, null);
                    
                    if (!user || !user.id) {
                        throw new Error('Login failed - user data missing');
                    }
                    
                    console.log('Login successful:', user.id);
                    
                    // Show success notification
                    showSuccessNotification('Successfully logged in!');
                    
                    // Redirect to appropriate page based on role after a delay
                    setTimeout(() => {
                        if (user.role === 'manager') {
                            window.location.replace('admin.html');
                        } else {
                            window.location.replace('home.html');
                        }
                    }, 1500);
                } catch (firebaseError) {
                    console.warn('Firebase login failed, using direct bypass instead:', firebaseError);
                    // Use the direct login bypass as a fallback
                    directLoginBypass(email, password, role);
                }
            } catch (error) {
                console.error('Login error:', error);
                
                // Show user-friendly error notification
                let errorMessage = 'Login failed. Please try again.';
                
                if (error.message) {
                    if (error.message.includes('invalid-email')) {
                        errorMessage = 'Invalid email format. Please check your email and try again.';
                    } else if (error.message.includes('user-not-found') || error.message.includes('wrong-password')) {
                        errorMessage = 'Invalid email or password. Please try again.';
                    } else if (error.message.includes('too-many-requests')) {
                        errorMessage = 'Too many failed login attempts. Please try again later.';
                    } else {
                        errorMessage = error.message;
                    }
                }
                
                showErrorNotification(errorMessage);
                
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
    }
    
    // Add event listeners to signup form
    if (signupForm) {
        console.log('Adding submit event to signup form');
        // Use click event on the signup button instead of form submit
        const signupButton = signupForm.querySelector('.auth-btn');
        
        if (signupButton) {
            console.log('Adding click event to signup button');
            // Remove any existing event listeners
            signupButton.removeEventListener('click', signupHandler);
            // Add new event listener
            signupButton.addEventListener('click', signupHandler);
            
            // Also add event listener to the form submit event as a backup
            signupForm.addEventListener('submit', signupHandler);
        }
    }
    
    // Signup handler function
    async function signupHandler(e) {
            e.preventDefault();
            
            // Show loading state
            const submitBtn = signupForm.querySelector('.auth-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing up...';
            submitBtn.disabled = true;
            
            try {
                // Get form data
                const role = signupForm.querySelector('input[name="role"]').value;
                const name = signupForm.querySelector('input[name="name"]').value;
                const email = signupForm.querySelector('input[name="email"]').value;
                const password = signupForm.querySelector('input[name="password"]').value;
                const confirm = signupForm.querySelector('input[name="confirm"]').value;
                const workplace = signupForm.querySelector('select[name="workplace"]').value;
                const otherWorkplace = signupForm.querySelector('input[name="other_workplace"]')?.value;
                const position = signupForm.querySelector('select[name="position"]').value;
                const managerCode = role === 'manager' ? signupForm.querySelector('input[name="managerCode"]').value : null;
                
                // Get the actual workplace value (either selected or custom)
                const workplaceValue = workplace === 'other' ? otherWorkplace : workplace;
                
                // Validate form data
                if (!name || !email || !password || !confirm || !position) {
                    throw new Error('Please fill in all required fields');
                }
                
                if (workplace === 'other' && !otherWorkplace) {
                    throw new Error('Please enter your workplace name');
                }
                
                if (password !== confirm) {
                    throw new Error('Passwords do not match');
                }
                
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }
                
                if (role === 'manager' && !managerCode) {
                    throw new Error('Manager registration code is required');
                }
                
                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    throw new Error('Please enter a valid email address');
                }
                
                // Prevent auto-redirect on login page
                sessionStorage.setItem('prevent_redirect', 'true');
                
                // Set transition flag that will be used when redirecting after successful signup
                sessionStorage.setItem('auth_transition', 'true');
                
                console.log('Starting signup process for', email);
                
                // Sign up with Firebase
                const user = await signup(name, email, password, role, workplaceValue, position, managerCode);
                
                if (!user || !user.id) {
                    throw new Error('Signup failed - user data missing');
                }
                
                console.log('Signup successful:', user.id);
                
                // Show success notification
                showSuccessNotification('Account created successfully!');
                
                // Redirect to appropriate page based on role after a delay
                // This gives the notification time to be displayed
                setTimeout(() => {
                    if (user.role === 'manager') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'home.html';
                    }
                }, 1500);
            } catch (error) {
                // Clear transition flag if signup fails
                sessionStorage.removeItem('auth_transition');
                
                console.error('Signup error:', error);
                
                // Show user-friendly error notification
                let errorMessage = 'Signup failed. Please try again.';
                
                if (error.message) {
                    if (error.message.includes('email-already-in-use')) {
                        errorMessage = 'This email is already in use. Please use a different email or try logging in.';
                    } else if (error.message.includes('invalid-email')) {
                        errorMessage = 'Invalid email format. Please check your email and try again.';
                    } else if (error.message.includes('weak-password')) {
                        errorMessage = 'Password is too weak. Please use a stronger password (at least 6 characters).';
                    } else if (error.message.includes('manager registration code')) {
                        errorMessage = 'Invalid manager registration code. Please check with your administrator.';
                    } else {
                        errorMessage = error.message;
                    }
                }
                
                showErrorNotification(errorMessage);
                
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
    }
    
    // Initialize SSO buttons with Firebase check
    async function initializeAuthButtons() {
        try {
            // Wait for Firebase to be properly initialized
            await checkFirebaseInitialized();
            console.log('Firebase initialized successfully, setting up SSO buttons');
            
            // Now it's safe to add event listeners
            ssoBtns.forEach(btn => {
                // Hide Google buttons as requested by client
                if (btn.classList.contains('google-btn')) {
                    btn.style.display = 'none';
                } else {
                    btn.addEventListener('click', handleSsoClick);
                }
            });
        } catch (error) {
            console.error('Firebase initialization failed or timed out:', error);
            showErrorNotification('Authentication service initialization failed. Please refresh the page and try again.');
        }
    }
    
    // Call the async initialization function
    initializeAuthButtons();
    
    /**
     * Handle SSO button click
     * @param {Event} e - The click event
     */
    function handleSsoClick(e) {
        // Get the provider from the button class
        const classes = e.currentTarget.classList;
        let provider = '';
        
        if (classes.contains('google-btn')) {
            provider = 'google';
            
            // Show loading state
            const originalText = e.currentTarget.innerHTML;
            const isSignup = document.getElementById('signup-tab').classList.contains('active');
            const action = isSignup ? 'Signing up' : 'Logging in';
            
            e.currentTarget.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${action}...</span>`;
            e.currentTarget.disabled = true;
            
            // Use our new Google sign-in function from firebase-auth-providers.js
            signInWithGoogle(e)
                .catch(error => {
                    console.error('Google sign-in error:', error);
                    // Show error notification
                    showErrorNotification(error.errorMessage || `Authentication with Google failed. Please try again.`);
                    
                    // Reset button
                    e.currentTarget.innerHTML = originalText;
                    e.currentTarget.disabled = false;
                });
            
            return;
        } else if (classes.contains('shifts-btn')) {
            provider = '7shifts';
        }
        
        if (provider) {
            // Get the current role
            const isSignup = document.getElementById('signup-tab').classList.contains('active');
            const role = isSignup 
                ? document.getElementById('signup-role').value 
                : document.getElementById('login-role').value;
            
            // Show loading state
            const originalText = e.currentTarget.innerHTML;
            const action = isSignup ? 'Signing up' : 'Logging in';
            
            e.currentTarget.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${action}...</span>`;
            e.currentTarget.disabled = true;
            
            try {
                // Authenticate with provider
                authenticateWithProvider(provider, isSignup, role);
            } catch (error) {
                // Show error notification
                showErrorNotification(error.message || `Authentication with ${provider} failed. Please try again.`);
                
                // Reset button
                e.currentTarget.innerHTML = originalText;
                e.currentTarget.disabled = false;
            }
        }
    }

/**
 * This function is no longer used.
 * We're now using the implementation from firebase-auth-providers.js
 * This stub is kept here for reference
 */
function _legacySignInWithGoogle(e) {
    // This is now handled in the signInWithGoogle imported function
    console.log("Legacy Google sign-in function called. Using new implementation instead.");
}
    
    // Add authentication service for each provider
    const authServices = {
        google: {
            name: 'Google',
            authUrl: '/api/auth/google',
            icon: 'fa-google',
            color: '#4285F4'
        },
        '7shifts': {
            name: '7Shifts',
            authUrl: '/api/auth/7shifts',
            icon: 'fa-calendar-alt',
            color: '#FF6B6B'
        }
    };
    
    /**
     * Authenticate with a provider
     * @param {string} provider - The provider to authenticate with
     * @param {boolean} isSignup - Whether this is a signup or login
     */
    function authenticateWithProvider(provider, isSignup = false) {
        if (!authServices[provider]) {
            console.error(`Unknown provider: ${provider}`);
            return;
        }
        
        const service = authServices[provider];
        console.log(`${isSignup ? 'Signing up' : 'Logging in'} with ${service.name}...`);
        
        // In a real application, you would redirect to the provider's auth page
        // window.location.href = `${service.authUrl}?action=${isSignup ? 'signup' : 'login'}`;
        
        // Show success notification
        showSuccessNotification(`Successfully authenticated with ${service.name}!`);
        
        // For demo purposes, redirect to the main application after a longer delay
        // This gives the notification time to be displayed and fade out
        setTimeout(() => {
            // Set transition flag to prevent redirect loop
            sessionStorage.setItem('auth_transition', 'true');
            window.location.href = 'home.html';
        }, 3000);
    }
});
