/**
 * Utility functions for UI manipulation and interaction
 */

/**
 * Creates an element with specified attributes and children
 * @param {string} tag - The HTML tag name
 * @param {Object} attributes - Attributes to set on the element
 * @param {Array|Node|string} children - Child elements or text content
 * @returns {HTMLElement} - The created element
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.entries(value).forEach(([prop, val]) => {
                element.style[prop] = val;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.entries(value).forEach(([dataKey, dataVal]) => {
                element.dataset[dataKey] = dataVal;
            });
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Add children
    if (Array.isArray(children)) {
        children.forEach(child => {
            if (child instanceof Node) {
                element.appendChild(child);
            } else if (child !== null && child !== undefined) {
                element.appendChild(document.createTextNode(String(child)));
            }
        });
    } else if (children instanceof Node) {
        element.appendChild(children);
    } else if (children !== null && children !== undefined) {
        element.textContent = String(children);
    }
    
    return element;
}

/**
 * Shows a notification message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'info', 'warning')
 * @param {number} duration - How long to show the notification in ms (default: 3000)
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = createElement('div', {
            id: 'notification-container',
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '1000',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }
        });
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = createElement('div', {
        className: `notification notification-${type}`,
        style: {
            padding: '12px 20px',
            borderRadius: '4px',
            boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
            marginBottom: '10px',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            color: 'white',
            backgroundColor: type === 'success' ? '#2ecc71' : 
                            type === 'error' ? '#e74c3c' : 
                            type === 'warning' ? '#f39c12' : '#3498db'
        }
    }, message);
    
    // Add close button
    const closeBtn = createElement('span', {
        style: {
            marginLeft: '10px',
            cursor: 'pointer',
            fontWeight: 'bold'
        },
        onClick: () => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, '×');
    
    notification.appendChild(closeBtn);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

/**
 * Creates a confirmation dialog
 * @param {string} message - The message to display
 * @param {Function} onConfirm - Callback function when user confirms
 * @param {Function} onCancel - Callback function when user cancels
 */
export function confirmDialog(message, onConfirm, onCancel = () => {}) {
    // Create modal backdrop
    const backdrop = createElement('div', {
        className: 'modal-backdrop',
        style: {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '2000'
        }
    });
    
    // Create modal content
    const modal = createElement('div', {
        className: 'modal-content',
        style: {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '400px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
        }
    });
    
    // Create message
    const messageEl = createElement('p', {
        style: {
            marginBottom: '20px'
        }
    }, message);
    
    // Create buttons container
    const buttonsContainer = createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
        }
    });
    
    // Create cancel button
    const cancelBtn = createElement('button', {
        className: 'btn btn-secondary',
        style: {
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        },
        onClick: () => {
            backdrop.remove();
            onCancel();
        }
    }, 'Cancel');
    
    // Create confirm button
    const confirmBtn = createElement('button', {
        className: 'btn btn-primary',
        style: {
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        },
        onClick: () => {
            backdrop.remove();
            onConfirm();
        }
    }, 'Confirm');
    
    // Assemble modal
    buttonsContainer.appendChild(cancelBtn);
    buttonsContainer.appendChild(confirmBtn);
    modal.appendChild(messageEl);
    modal.appendChild(buttonsContainer);
    backdrop.appendChild(modal);
    
    // Add to document
    document.body.appendChild(backdrop);
    
    // Focus confirm button
    confirmBtn.focus();
}

/**
 * Updates the progress bar
 * @param {HTMLElement} progressBar - The progress bar element
 * @param {number} percent - The percentage to set (0-100)
 */
export function updateProgressBar(progressBar, percent) {
    if (!progressBar) return;
    
    // Ensure percent is between 0 and 100
    const validPercent = Math.max(0, Math.min(100, percent));
    
    // Update width
    progressBar.style.width = `${validPercent}%`;
    
    // Update aria attributes for accessibility
    progressBar.setAttribute('aria-valuenow', validPercent);
    
    // Add color classes based on progress
    progressBar.className = 'progress-bar';
    if (validPercent < 25) {
        progressBar.classList.add('progress-bar-danger');
    } else if (validPercent < 50) {
        progressBar.classList.add('progress-bar-warning');
    } else if (validPercent < 75) {
        progressBar.classList.add('progress-bar-info');
    } else {
        progressBar.classList.add('progress-bar-success');
    }
}

/**
 * Creates a countdown timer
 * @param {HTMLElement} container - The container element for the timer
 * @param {number} seconds - The number of seconds to count down from
 * @param {Function} onComplete - Callback function when countdown completes
 * @returns {Object} - Timer control object with start, pause, resume, and stop methods
 */
export function createCountdown(container, seconds, onComplete = () => {}) {
    let remainingSeconds = seconds;
    let intervalId = null;
    let isPaused = true;
    
    // Update the display
    const updateDisplay = () => {
        const minutes = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        container.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Initial display
    updateDisplay();
    
    // Timer tick function
    const tick = () => {
        remainingSeconds--;
        updateDisplay();
        
        if (remainingSeconds <= 0) {
            stop();
            onComplete();
        }
    };
    
    // Start the timer
    const start = () => {
        if (!isPaused) return;
        
        isPaused = false;
        intervalId = setInterval(tick, 1000);
    };
    
    // Pause the timer
    const pause = () => {
        if (isPaused) return;
        
        isPaused = true;
        clearInterval(intervalId);
    };
    
    // Resume the timer
    const resume = () => {
        if (!isPaused) return;
        
        isPaused = false;
        intervalId = setInterval(tick, 1000);
    };
    
    // Stop the timer
    const stop = () => {
        isPaused = true;
        clearInterval(intervalId);
    };
    
    // Reset the timer
    const reset = (newSeconds = seconds) => {
        stop();
        remainingSeconds = newSeconds;
        updateDisplay();
    };
    
    return {
        start,
        pause,
        resume,
        stop,
        reset
    };
}
