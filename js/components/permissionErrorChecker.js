/**
 * Permission Error Checker
 * 
 * This component monitors for Firebase permission errors and offers solutions,
 * including running the Firebase rules update script.
 */

import { showNotification } from '../utils/uiUtils.js';
import { applyFirestorePatch } from '../utils/firestorePatch.js';

class PermissionErrorChecker {
    constructor() {
        this.permissionErrorCount = 0;
        this.lastErrorTime = 0;
        this.solutionShown = false;
        this.MAX_ERRORS_BEFORE_SUGGESTION = 2;
        this.ERROR_THRESHOLD_TIME_MS = 10000; // 10 seconds
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the permission error checker
     */
    init() {
        console.log('🔍 Initializing Permission Error Checker...');
        
        // Override console.error to detect permission errors
        this.overrideConsoleError();
        
        // Apply Firestore patch
        this.applyFirestorePatch();
        
        console.log('✅ Permission Error Checker initialized');
    }
    
    /**
     * Override console.error to detect Firebase permission errors
     */
    overrideConsoleError() {
        const originalConsoleError = console.error;
        const self = this;
        
        console.error = function(...args) {
            // Call the original console.error
            originalConsoleError.apply(console, args);
            
            // Check if this is a Firebase permission error
            const errorMessage = args.join(' ');
            if (self.isFirebasePermissionError(errorMessage)) {
                self.handlePermissionError();
            }
        };
    }
    
    /**
     * Check if an error message is a Firebase permission error
     * @param {string} errorMessage Error message to check
     * @returns {boolean} True if this is a permission error
     */
    isFirebasePermissionError(errorMessage) {
        if (typeof errorMessage !== 'string') return false;
        
        const lowerCaseError = errorMessage.toLowerCase();
        return lowerCaseError.includes('permission') && 
               (lowerCaseError.includes('denied') || lowerCaseError.includes('missing')) &&
               (lowerCaseError.includes('firebase') || lowerCaseError.includes('firestore'));
    }
    
    /**
     * Handle a detected permission error
     */
    handlePermissionError() {
        const now = Date.now();
        
        // If it's been more than the threshold time since the last error,
        // reset the error count
        if (now - this.lastErrorTime > this.ERROR_THRESHOLD_TIME_MS) {
            this.permissionErrorCount = 0;
        }
        
        // Update the last error time and increment the error count
        this.lastErrorTime = now;
        this.permissionErrorCount++;
        
        // If we've reached the threshold and haven't shown a solution yet,
        // offer solutions
        if (this.permissionErrorCount >= this.MAX_ERRORS_BEFORE_SUGGESTION && !this.solutionShown) {
            this.offerSolutions();
            this.solutionShown = true;
        }
    }
    
    /**
     * Offer solutions to the user
     */
    offerSolutions() {
        console.log('💡 Multiple Firebase permission errors detected. Offering solutions...');
        
        // Create a container for our message if it doesn't exist
        let container = document.getElementById('permission-error-solutions');
        if (!container) {
            container = document.createElement('div');
            container.id = 'permission-error-solutions';
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.right = '20px';
            container.style.backgroundColor = 'white';
            container.style.padding = '15px';
            container.style.borderRadius = '8px';
            container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            container.style.zIndex = '9999';
            container.style.maxWidth = '350px';
            container.style.fontSize = '14px';
            document.body.appendChild(container);
        }
        
        // Add content to the container
        container.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; color: #e74c3c;">
                ⚠️ Firebase Permission Errors Detected
            </div>
            <p style="margin-bottom: 15px;">
                We've detected multiple Firebase permission errors. This is likely caused by outdated security rules.
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <a href="firebase-rules-update.html" target="_blank" style="
                    padding: 8px 12px;
                    background: linear-gradient(135deg, #FF8C42, #F76E11);
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    text-align: center;
                    font-weight: 600;
                ">Update Firebase Rules</a>
                
                <a href="establishment-migration.html" target="_blank" style="
                    padding: 8px 12px;
                    background: white;
                    color: #F76E11;
                    text-decoration: none;
                    border-radius: 4px;
                    border: 1px solid #F76E11;
                    text-align: center;
                    font-weight: 600;
                ">Migrate Establishments</a>
                
                <button id="dismiss-permission-error" style="
                    padding: 8px 12px;
                    background: #f5f5f5;
                    color: #666;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                ">Dismiss</button>
            </div>
        `;
        
        // Add event listener to the dismiss button
        document.getElementById('dismiss-permission-error').addEventListener('click', () => {
            container.remove();
        });
        
        // Show a notification as well
        showNotification(
            'Firebase permission errors detected. Click "Update Firebase Rules" to fix.',
            'warning',
            10000
        );
    }
    
    /**
     * Apply the Firestore patch to handle permission errors
     */
    applyFirestorePatch() {
        setTimeout(() => {
            try {
                const result = applyFirestorePatch();
                
                if (typeof result === 'function') {
                    // If the patch returned a function, it means Firebase wasn't loaded yet
                    // Try again after a delay
                    setTimeout(() => {
                        try {
                            const delayedResult = result();
                            console.log('Delayed Firestore patch result:', delayedResult ? 'Success' : 'Failed');
                        } catch (delayedError) {
                            console.error('Error applying delayed Firestore patch:', delayedError);
                        }
                    }, 2000);
                }
            } catch (error) {
                console.error('Error applying Firestore patch:', error);
            }
        }, 1000); // Wait for Firebase to be loaded
    }
}

// Export an instance of the class
export const permissionErrorChecker = new PermissionErrorChecker();

// Also export a function to manually initialize it
export function initPermissionErrorChecker() {
    return permissionErrorChecker;
}
