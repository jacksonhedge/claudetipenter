/**
 * Celebration Popup Component
 * Displays a celebratory popup with confetti and balloons showing the total tips
 */

export default class CelebrationPopup {
    /**
     * Initialize the celebration popup component
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = {
            duration: 5000, // Duration in milliseconds
            confettiCount: 150,
            balloonCount: 10,
            ...options
        };
        
        // Create the popup element
        this.createPopupElement();
    }
    
    /**
     * Create the popup element
     */
    createPopupElement() {
        // Create popup container if it doesn't exist
        let popupContainer = document.getElementById('celebrationPopupContainer');
        if (!popupContainer) {
            popupContainer = document.createElement('div');
            popupContainer.id = 'celebrationPopupContainer';
            popupContainer.className = 'celebration-popup-container';
            popupContainer.style.display = 'none';
            document.body.appendChild(popupContainer);
            
            // Create popup content
            const popupContent = document.createElement('div');
            popupContent.className = 'celebration-popup-content';
            
            // Create header
            const header = document.createElement('h2');
            header.textContent = 'Total Tips';
            header.className = 'celebration-header';
            
            // Create amount display
            const amountDisplay = document.createElement('div');
            amountDisplay.id = 'celebrationAmount';
            amountDisplay.className = 'celebration-amount';
            amountDisplay.textContent = '$0.00';
            
            // Create message
            const message = document.createElement('p');
            message.className = 'celebration-message';
            message.textContent = 'Great job collecting tips!';
            
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.className = 'celebration-close-btn';
            closeButton.textContent = 'Close';
            closeButton.addEventListener('click', () => this.hidePopup());
            
            // Create confetti container
            const confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            
            // Create balloon container
            const balloonContainer = document.createElement('div');
            balloonContainer.className = 'balloon-container';
            
            // Assemble popup
            popupContent.appendChild(header);
            popupContent.appendChild(amountDisplay);
            popupContent.appendChild(message);
            popupContent.appendChild(closeButton);
            
            popupContainer.appendChild(confettiContainer);
            popupContainer.appendChild(balloonContainer);
            popupContainer.appendChild(popupContent);
        }
        
        this.popupContainer = popupContainer;
        this.amountDisplay = document.getElementById('celebrationAmount');
        this.confettiContainer = popupContainer.querySelector('.confetti-container');
        this.balloonContainer = popupContainer.querySelector('.balloon-container');
    }
    
    /**
     * Show the popup with the given amount
     * @param {number} amount - The total tip amount to display
     */
    showPopup(amount) {
        if (!this.popupContainer || !this.amountDisplay) return;
        
        // Format the amount
        const formattedAmount = typeof amount === 'number' ? 
            `$${amount.toFixed(2)}` : 
            (amount || '$0.00');
        
        // Update the amount display
        this.amountDisplay.textContent = formattedAmount;
        
        // Show the popup
        this.popupContainer.style.display = 'flex';
        
        // Create confetti and balloons
        this.createConfetti();
        this.createBalloons();
        
        // Add animation class
        this.popupContainer.classList.add('show-celebration');
        
        // Auto-hide after duration
        this.autoHideTimeout = setTimeout(() => {
            this.hidePopup();
        }, this.options.duration);
    }
    
    /**
     * Hide the popup
     */
    hidePopup() {
        if (!this.popupContainer) return;
        
        // Clear auto-hide timeout
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = null;
        }
        
        // Remove animation class
        this.popupContainer.classList.remove('show-celebration');
        
        // Hide the popup after animation
        setTimeout(() => {
            this.popupContainer.style.display = 'none';
            
            // Clear confetti and balloons
            if (this.confettiContainer) this.confettiContainer.innerHTML = '';
            if (this.balloonContainer) this.balloonContainer.innerHTML = '';
        }, 500);
    }
    
    /**
     * Create confetti elements
     */
    createConfetti() {
        if (!this.confettiContainer) return;
        
        // Clear existing confetti
        this.confettiContainer.innerHTML = '';
        
        // Colors for confetti
        const colors = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f'];
        
        // Create confetti pieces
        for (let i = 0; i < this.options.confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random properties
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5; // 5-15px
            const left = Math.random() * 100; // 0-100%
            const animationDuration = Math.random() * 3 + 2; // 2-5s
            const animationDelay = Math.random() * 2; // 0-2s
            
            // Apply styles
            confetti.style.backgroundColor = color;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.left = `${left}%`;
            confetti.style.animationDuration = `${animationDuration}s`;
            confetti.style.animationDelay = `${animationDelay}s`;
            
            // Add to container
            this.confettiContainer.appendChild(confetti);
        }
    }
    
    /**
     * Create balloon elements
     */
    createBalloons() {
        if (!this.balloonContainer) return;
        
        // Clear existing balloons
        this.balloonContainer.innerHTML = '';
        
        // Colors for balloons
        const colors = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f'];
        
        // Create balloon elements
        for (let i = 0; i < this.options.balloonCount; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            
            // Random properties
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 30 + 40; // 40-70px
            const left = Math.random() * 80 + 10; // 10-90%
            const animationDuration = Math.random() * 5 + 5; // 5-10s
            const animationDelay = Math.random() * 3; // 0-3s
            
            // Apply styles
            balloon.style.backgroundColor = color;
            balloon.style.width = `${size}px`;
            balloon.style.height = `${size * 1.2}px`;
            balloon.style.left = `${left}%`;
            balloon.style.animationDuration = `${animationDuration}s`;
            balloon.style.animationDelay = `${animationDelay}s`;
            
            // Add string to balloon
            const string = document.createElement('div');
            string.className = 'balloon-string';
            balloon.appendChild(string);
            
            // Add to container
            this.balloonContainer.appendChild(balloon);
        }
    }
}
