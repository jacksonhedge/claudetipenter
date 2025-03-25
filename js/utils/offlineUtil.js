/**
 * Offline Mode Utility
 * This utility helps manage offline mode for Firebase
 */

/**
 * Toggle offline mode for the application
 * @param {boolean} enabled - Whether offline mode should be enabled
 */
export function toggleOfflineMode(enabled = true) {
    localStorage.setItem('use_offline_mode', enabled ? 'true' : 'false');
    console.log(`Offline mode ${enabled ? 'enabled' : 'disabled'}`);
    
    // Force reload to apply the new setting
    window.location.reload();
}

/**
 * Check if offline mode is enabled
 * @returns {boolean} - Whether offline mode is enabled
 */
export function isOfflineModeEnabled() {
    return localStorage.getItem('use_offline_mode') === 'true';
}

/**
 * Add offline mode toggle to the UI
 * @param {string} containerId - The ID of the container element to add the toggle to
 */
export function addOfflineModeToggle(containerId = 'offline-mode-container') {
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById(containerId);
        if (!container) {
            // Create container if it doesn't exist
            const newContainer = document.createElement('div');
            newContainer.id = containerId;
            newContainer.style.position = 'fixed';
            newContainer.style.bottom = '10px';
            newContainer.style.left = '10px';
            newContainer.style.zIndex = '9999';
            newContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            newContainer.style.padding = '5px 10px';
            newContainer.style.borderRadius = '5px';
            newContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
            document.body.appendChild(newContainer);
            
            // Create toggle
            const toggleContainer = document.createElement('div');
            toggleContainer.style.display = 'flex';
            toggleContainer.style.alignItems = 'center';
            toggleContainer.style.gap = '5px';
            
            const label = document.createElement('label');
            label.textContent = 'Offline Mode';
            label.style.fontSize = '12px';
            label.style.userSelect = 'none';
            
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = isOfflineModeEnabled();
            toggle.addEventListener('change', () => {
                toggleOfflineMode(toggle.checked);
            });
            
            toggleContainer.appendChild(toggle);
            toggleContainer.appendChild(label);
            newContainer.appendChild(toggleContainer);
        }
    });
}

// Call the function to add the toggle by default
addOfflineModeToggle();

// Export a function to check if we should use offline mode
export function shouldUseOfflineMode() {
    const isLandingPage = window.location.pathname.includes('landing.html') || window.location.pathname.endsWith('/');
    const isExplicitlyEnabled = localStorage.getItem('use_offline_mode') === 'true';
    
    // Enable offline mode if explicitly enabled or on landing page
    return isExplicitlyEnabled || isLandingPage;
}
