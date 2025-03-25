/**
 * Notification Utilities
 * Provides functions for displaying notifications
 */

/**
 * Show a notification
 * @param {string} message - The notification message
 * @param {string} type - The notification type (success, error, info)
 * @param {number} duration - The duration in milliseconds before the notification disappears
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Check if a notification already exists and remove it
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle notification-icon"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle notification-icon"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle notification-icon"></i>';
            break;
    }
    
    // Set notification content
    notification.innerHTML = `
        ${icon}
        <span class="notification-message">${message}</span>
    `;
    
    // Add notification to the DOM
    document.body.appendChild(notification);
    
    // Show notification (delayed to allow for transition)
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after duration
    setTimeout(() => {
        notification.classList.add('fade-out');
        
        // Remove notification after animation completes
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, duration);
}

/**
 * Show a success notification
 * @param {string} message - The notification message
 * @param {number} duration - The duration in milliseconds before the notification disappears
 */
export function showSuccessNotification(message, duration = 3000) {
    showNotification(message, 'success', duration);
}

/**
 * Show an error notification
 * @param {string} message - The notification message
 * @param {number} duration - The duration in milliseconds before the notification disappears
 */
export function showErrorNotification(message, duration = 3000) {
    showNotification(message, 'error', duration);
}

/**
 * Show an info notification
 * @param {string} message - The notification message
 * @param {number} duration - The duration in milliseconds before the notification disappears
 */
export function showInfoNotification(message, duration = 3000) {
    showNotification(message, 'info', duration);
}
