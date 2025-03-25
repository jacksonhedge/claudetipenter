/**
 * App Initialization
 * Handles phased initialization of application components to prevent
 * "elements not found" errors and ensure components load in the right order
 */

// Import required components
import FileUploader from './components/fileUploader.js';
import EpsonScanner from './components/epsonScanner.js';
import { initGoogleDriveService } from './services/googleDriveService.js';
import ProfileModal from './components/profileModal.js';
import { isAuthenticated, getCurrentUser } from './services/authService.js';
import { showNotification } from './utils/uiUtils.js';
import { initializeFirebase } from './firebase-init.js';
import { UserModel, initializeDatabase, initializeUserSession } from './models/index.js';
import { applyFirestorePatch } from './utils/firestorePatch.js';

/**
 * Initialize the app in phases to ensure component dependencies are met
 */
export async function initializeApp() {
    console.log('🚀 Starting application initialization...');

    try {
        // Phase 0: Check authentication status for home.html
        console.log('🔍 Phase 0: Checking authentication status...');
        const isHomePage = window.location.pathname.endsWith('/home.html');
        
        if (isHomePage && !isAuthenticated()) {
            console.log('🔒 User not authenticated, redirecting to login page');
            window.location.href = 'login.html';
            return; // Stop initialization if redirecting
        }
        
        // Phase 1: Initialize Firebase and ensure collections exist
        console.log('🔍 Phase 1: Initializing Firebase...');
        await initializeFirebase();
        
        // Apply Firestore permissions patch to handle any permission errors gracefully
        console.log('🔧 Applying Firestore permissions patch...');
        try {
            const patchResult = applyFirestorePatch();
            
            // If the patch returned a function, it means it needs to be applied later
            if (typeof patchResult === 'function') {
                console.log('⏳ Firestore patch will be applied after Firebase is fully loaded');
                
                // Apply the patch immediately AND after delays to ensure it catches all Firebase operations
                // This multi-attempt approach provides more robust coverage for Firebase operations
                
                // Immediate attempt
                try {
                    const immediateResult = patchResult();
                    console.log('First attempt at Firestore patch:', immediateResult ? 'Success' : 'Pending');
                } catch (immediateError) {
                    console.warn('First attempt at Firestore patch failed:', immediateError.message);
                }
                
                // Try again after 500ms
                setTimeout(() => {
                    try {
                        const delayedResult1 = patchResult();
                        console.log('Second attempt at Firestore patch:', delayedResult1 ? 'Success' : 'Pending');
                    } catch (delayedError) {
                        console.warn('Second attempt at Firestore patch failed:', delayedError.message);
                    }
                }, 500);
                
                // Try again after 1500ms
                setTimeout(() => {
                    try {
                        const delayedResult2 = patchResult();
                        console.log('Third attempt at Firestore patch:', delayedResult2 ? 'Success' : 'Pending');
                    } catch (delayedError) {
                        console.warn('Third attempt at Firestore patch failed:', delayedError.message);
                    }
                }, 1500);
                
                // Final attempt at 3000ms
                setTimeout(() => {
                    try {
                        const finalResult = patchResult();
                        if (finalResult === true) {
                            console.log('✅ Final Firestore permissions patch applied successfully');
                        } else {
                            console.warn('⚠️ Could not apply final Firestore permissions patch');
                        }
                    } catch (finalError) {
                        console.error('❌ Error applying final Firestore permissions patch:', finalError);
                    }
                }, 3000);
            } else if (patchResult === true) {
                console.log('✅ Firestore permissions patch applied successfully on first try');
            } else {
                console.warn('⚠️ Could not apply Firestore permissions patch');
            }
        } catch (error) {
            console.error('❌ Error applying Firestore permissions patch:', error);
            
            // Even if the patch fails, try to suppress Firebase error messages
            // This helps prevent the console from being flooded with error messages
            try {
                const originalConsoleError = console.error;
                console.error = function(...args) {
                    const errorString = args.join(' ');
                    if (errorString.includes('Firestore/Write/channel') && 
                        errorString.includes('400 (Bad Request)')) {
                        console.warn('⚠️ Suppressed Firebase write channel error after patch failure');
                        return;
                    }
                    return originalConsoleError.apply(this, args);
                };
                console.log('✅ Applied error suppression as fallback');
            } catch (suppressError) {
                console.warn('⚠️ Could not apply error suppression fallback:', suppressError);
            }
        }
        
        // Phase 2: Initialize database models and schema
        console.log('🔍 Phase 2: Initializing database models...');
        await initializeDatabase();
        
        // Phase 3: Initialize authentication and user profile
        console.log('🔍 Phase 3: Initializing authentication...');
        await initializeAuth();
        
        // Phase 4: Initialize main UI components
        console.log('🔍 Phase 4: Initializing UI components...');
        await initializeUIComponents();
        
        // Phase 5: Initialize optional components
        console.log('🔍 Phase 5: Initializing optional components...');
        await initializeOptionalComponents();
        
        console.log('✅ Application initialization complete');
    } catch (error) {
        console.error('❌ Error during application initialization:', error);
        showNotification('There was an error initializing the application. Some features may not work properly.', 'error', 5000);
    }
}

/**
 * Initialize authentication and user profile
 */
async function initializeAuth() {
    console.log('🔑 Initializing authentication...');
    
    try {
        // Initialize session and user data
        if (isAuthenticated()) {
            const currentUser = await getCurrentUser();
            
            if (currentUser) {
                // Convert to UserModel if needed
                const userModel = currentUser instanceof UserModel 
                    ? currentUser 
                    : new UserModel(currentUser);
                
                // Initialize user session (establishes association with establishments)
                const { user, establishment, staff } = await initializeUserSession(userModel);
                
                // Store session data in window for access by other components
                window.appSession = {
                    user,
                    establishment,
                    staff,
                    authenticated: true
                };
                
                console.log('✅ User session initialized', window.appSession);
            }
        } else {
            // Set empty session
            window.appSession = {
                authenticated: false
            };
        }
        
        // Initialize profile modal
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            const profileModal = new ProfileModal();
            // Store the profileModal instance globally for debugging
            window.profileModal = profileModal;
            // Force load the user data
            profileModal.loadUserData().then(() => {
                console.log('✅ Profile modal data loaded successfully');
            }).catch(err => {
                console.error('❌ Error loading profile data:', err);
            });
            console.log('✅ Profile modal initialized');
        } else {
            console.log('ℹ️ Profile button not found, skipping profile modal initialization');
        }
        
        // Update auth UI based on login status
        await updateAuthUI();
    } catch (error) {
        console.error('❌ Error initializing authentication:', error);
        // Continue initialization even if auth fails
    }
}

/**
 * Update UI elements based on authentication status
 */
async function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    
    if (isAuthenticated()) {
        try {
            const user = await getCurrentUser();
            
            if (authLink) {
                authLink.textContent = 'Logout';
                authLink.classList.add('logout');
                authLink.href = '#';
                
                // Create user info element if it doesn't exist
                let userInfoEl = document.querySelector('.user-info');
                if (!userInfoEl) {
                    userInfoEl = document.createElement('div');
                    userInfoEl.className = 'user-info';
                    authLink.parentNode.insertBefore(userInfoEl, authLink);
                }
                
                // Update user info
                if (user && user.name) {
                    userInfoEl.innerHTML = `Welcome, <span class="user-name">${user.name}</span>`;
                } else {
                    userInfoEl.innerHTML = `Welcome, <span class="user-name">User</span>`;
                }
            }
            
            // Update establishment info if available
            const establishmentEl = document.getElementById('currentEstablishment');
            if (establishmentEl && window.appSession && window.appSession.establishment) {
                establishmentEl.textContent = window.appSession.establishment.name;
            }
            
            console.log('✅ Auth UI updated for authenticated user');
        } catch (error) {
            console.error('❌ Error getting current user:', error);
            // Fallback to default user info
            if (authLink) {
                authLink.textContent = 'Logout';
                authLink.classList.add('logout');
                authLink.href = '#';
                
                let userInfoEl = document.querySelector('.user-info');
                if (!userInfoEl) {
                    userInfoEl = document.createElement('div');
                    userInfoEl.className = 'user-info';
                    authLink.parentNode.insertBefore(userInfoEl, authLink);
                }
                
                // Fallback user info
                userInfoEl.innerHTML = `Welcome, <span class="user-name">User</span>`;
            }
            
            console.log('⚠️ Using fallback auth UI due to error');
        }
    } else {
        if (authLink) {
            authLink.textContent = 'Login';
            authLink.classList.remove('logout');
            authLink.href = 'login.html';
            
            // Remove user info element if it exists
            const userInfoEl = document.querySelector('.user-info');
            if (userInfoEl) {
                userInfoEl.remove();
            }
        }
        
        console.log('ℹ️ Auth UI updated for non-authenticated user');
        
        // If this is home.html and user is not authenticated, redirect to login
        const isHomePage = window.location.pathname.endsWith('/home.html');
        if (isHomePage) {
            console.log('🔒 User not authenticated but on home page, redirecting to login');
            window.location.href = 'login.html';
        }
    }
}

/**
 * Initialize main UI components with error handling
 */
async function initializeUIComponents() {
    console.log('🖥️ Initializing UI components...');
    
    // Initialize File Uploader with fallback
    try {
        initializeFileUploader();
    } catch (error) {
        console.error('❌ Error initializing File Uploader:', error);
    }
    
    // Initialize Google Drive Integration
    try {
        initGoogleDriveService();
        console.log('✅ Google Drive Service initialized');
    } catch (error) {
        console.error('❌ Error initializing Google Drive Service:', error);
    }
}

/**
 * Initialize File Uploader with retry and polling for DOM elements
 */
function initializeFileUploader() {
    // Initialize global app components container if it doesn't exist
    if (!window.appComponents) {
        window.appComponents = {};
    }
    
    // Try to find required elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const processBtn = document.getElementById('processBtn');
    
    // Check if required elements exist
    if (dropArea && fileInput && fileList) {
        // All elements found, initialize FileUploader
        const fileUploader = new FileUploader({
            dropAreaId: 'dropArea',
            fileInputId: 'fileInput',
            fileListId: 'fileList',
            fileCountId: 'fileCount',
            processBtnId: 'processBtn',
            onFileCountChange: (count) => {
                // Update the process button text based on file count
                if (processBtn) {
                    processBtn.textContent = `Process ${count} Image${count !== 1 ? 's' : ''}`;
                }
            }
        });
        
        // Store the fileUploader instance in the global appComponents object
        window.appComponents.fileUploader = fileUploader;
        
        console.log('✅ File Uploader initialized and stored in window.appComponents.fileUploader');
        
        // Initialize Epson Scanner with the FileUploader instance
        initializeEpsonScanner(fileUploader);
        
        return fileUploader;
    } else {
        // Elements not found, log which ones are missing
        const missing = [];
        if (!dropArea) missing.push('dropArea');
        if (!fileInput) missing.push('fileInput');
        if (!fileList) missing.push('fileList');
        
        console.warn(`⚠️ Some required elements for FileUploader not found: ${missing.join(', ')}`);
        console.warn('⚠️ FileUploader initialization skipped');
        
        return null;
    }
}

/**
 * Initialize Epson Scanner with better error handling
 */
function initializeEpsonScanner(fileUploader) {
    // Check if scan button exists
    const scanBtn = document.getElementById('scanBtn');
    
    if (scanBtn && fileUploader) {
        try {
            // Initialize Epson Scanner
            const epsonScanner = new EpsonScanner({
                scanBtnId: 'scanBtn',
                onFilesAdded: fileUploader.createFilePreview.bind(fileUploader)
            });
            
            console.log('✅ Epson Scanner initialized');
        } catch (error) {
            console.error('❌ Error initializing Epson Scanner:', error);
        }
    } else {
        console.warn('⚠️ Scan button or FileUploader not found, skipping Epson Scanner initialization');
    }
}

/**
 * Initialize optional components
 */
async function initializeOptionalComponents() {
    console.log('🧩 Initializing optional components...');
    
    // Any additional components that are nice-to-have but not critical
    // These will be initialized last and failures won't block the app
}

// Export a function to explicitly start initialization
export function startAppInitialization() {
    // Wait for DOM content to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
        console.log('⏳ Waiting for DOMContentLoaded event...');
    } else {
        // DOM already loaded, initialize immediately
        initializeApp();
    }
}
