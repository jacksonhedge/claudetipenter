/**
 * Export Options Component
 * Handles the export options modal and export functionality
 */

export default class ExportOptions {
    /**
     * Initialize the export options component
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // DOM Elements
        this.exportSlideshowBtn = document.getElementById('exportSlideshowBtn');
        this.exportOptionsModal = document.getElementById('exportOptionsModal');
        this.closeModalBtn = document.querySelector('.close-modal');
        
        // Export option buttons
        this.exportEmailBtn = document.getElementById('exportEmailBtn');
        this.exportTextBtn = document.getElementById('exportTextBtn');
        this.exportFileBtn = document.getElementById('exportFileBtn');
        
        // Input containers
        this.emailInputContainer = document.getElementById('emailInputContainer');
        this.textInputContainer = document.getElementById('textInputContainer');
        
        // Input fields and confirm buttons
        this.emailInput = document.getElementById('emailInput');
        this.phoneInput = document.getElementById('phoneInput');
        this.confirmEmailBtn = document.getElementById('confirmEmailBtn');
        this.confirmTextBtn = document.getElementById('confirmTextBtn');
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Add event listeners
        if (this.exportSlideshowBtn) {
            this.exportSlideshowBtn.addEventListener('click', this.openModal.bind(this));
        }
        
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', this.closeModal.bind(this));
        }
        
        // Close modal when clicking outside
        if (this.exportOptionsModal) {
            this.exportOptionsModal.addEventListener('click', (e) => {
                if (e.target === this.exportOptionsModal) {
                    this.closeModal();
                }
            });
        }
        
        // Export option button event listeners
        if (this.exportEmailBtn) {
            this.exportEmailBtn.addEventListener('click', this.toggleEmailInput.bind(this));
        }
        
        if (this.exportTextBtn) {
            this.exportTextBtn.addEventListener('click', this.toggleTextInput.bind(this));
        }
        
        if (this.exportFileBtn) {
            this.exportFileBtn.addEventListener('click', this.exportToPdf.bind(this));
        }
        
        // Confirm button event listeners
        if (this.confirmEmailBtn) {
            this.confirmEmailBtn.addEventListener('click', this.exportToEmail.bind(this));
        }
        
        if (this.confirmTextBtn) {
            this.confirmTextBtn.addEventListener('click', this.exportToText.bind(this));
        }
        
        // Add keyboard event listener for Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.exportOptionsModal && this.exportOptionsModal.style.display === 'block') {
                this.closeModal();
            }
        });
    }
    
    /**
     * Open the export options modal
     */
    openModal() {
        console.log('[ExportOptions] Opening export options modal');
        
        if (this.exportOptionsModal) {
            this.exportOptionsModal.style.display = 'block';
            
            // Reset input containers
            if (this.emailInputContainer) {
                this.emailInputContainer.style.display = 'none';
            }
            
            if (this.textInputContainer) {
                this.textInputContainer.style.display = 'none';
            }
        }
    }
    
    /**
     * Close the export options modal
     */
    closeModal() {
        console.log('[ExportOptions] Closing export options modal');
        
        if (this.exportOptionsModal) {
            this.exportOptionsModal.style.display = 'none';
        }
    }
    
    /**
     * Toggle the email input container
     */
    toggleEmailInput() {
        console.log('[ExportOptions] Toggling email input');
        
        if (this.emailInputContainer) {
            // Toggle email input container
            const isVisible = this.emailInputContainer.style.display === 'flex';
            this.emailInputContainer.style.display = isVisible ? 'none' : 'flex';
            
            // Hide text input container
            if (this.textInputContainer) {
                this.textInputContainer.style.display = 'none';
            }
            
            // Focus on email input if visible
            if (!isVisible && this.emailInput) {
                this.emailInput.focus();
                
                // Try to get stored email from localStorage
                const storedEmail = localStorage.getItem('userEmail');
                if (storedEmail) {
                    this.emailInput.value = storedEmail;
                }
            }
        }
    }
    
    /**
     * Toggle the text input container
     */
    toggleTextInput() {
        console.log('[ExportOptions] Toggling text input');
        
        if (this.textInputContainer) {
            // Toggle text input container
            const isVisible = this.textInputContainer.style.display === 'flex';
            this.textInputContainer.style.display = isVisible ? 'none' : 'flex';
            
            // Hide email input container
            if (this.emailInputContainer) {
                this.emailInputContainer.style.display = 'none';
            }
            
            // Focus on phone input if visible
            if (!isVisible && this.phoneInput) {
                this.phoneInput.focus();
                
                // Try to get stored phone number from localStorage
                const storedPhone = localStorage.getItem('userPhone');
                if (storedPhone) {
                    this.phoneInput.value = storedPhone;
                }
            }
        }
    }
    
    /**
     * Export to email
     */
    exportToEmail() {
        console.log('[ExportOptions] Exporting to email');
        
        if (this.emailInput) {
            const email = this.emailInput.value.trim();
            
            if (!email) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Store email in localStorage for future use
            localStorage.setItem('userEmail', email);
            
            // Get the current images from the organizer grid
            const organizedGrid = document.getElementById('organizedGrid');
            if (organizedGrid && organizedGrid.__component && organizedGrid.__component.getCurrentImages) {
                const images = organizedGrid.__component.getCurrentImages();
                
                if (!images || images.length === 0) {
                    alert('No images available to export');
                    return;
                }
                
                // In a real implementation, this would send the images to the server
                // for email processing. For now, we'll just show a success message.
                alert(`Slideshow will be sent to ${email}`);
                
                // Close the modal
                this.closeModal();
            } else {
                alert('No images available to export');
            }
        }
    }
    
    /**
     * Export to text
     */
    exportToText() {
        console.log('[ExportOptions] Exporting to text');
        
        if (this.phoneInput) {
            const phone = this.phoneInput.value.trim();
            
            if (!phone) {
                alert('Please enter a valid phone number');
                return;
            }
            
            // Validate phone format (simple validation)
            const phoneRegex = /^\+?[0-9\s\-\(\)]{10,15}$/;
            if (!phoneRegex.test(phone)) {
                alert('Please enter a valid phone number');
                return;
            }
            
            // Store phone in localStorage for future use
            localStorage.setItem('userPhone', phone);
            
            // Get the current images from the organizer grid
            const organizedGrid = document.getElementById('organizedGrid');
            if (organizedGrid && organizedGrid.__component && organizedGrid.__component.getCurrentImages) {
                const images = organizedGrid.__component.getCurrentImages();
                
                if (!images || images.length === 0) {
                    alert('No images available to export');
                    return;
                }
                
                // In a real implementation, this would send the images to the server
                // for text processing. For now, we'll just show a success message.
                alert(`Slideshow will be sent to ${phone}`);
                
                // Close the modal
                this.closeModal();
            } else {
                alert('No images available to export');
            }
        }
    }
    
    /**
     * Export to PDF
     */
    exportToPdf() {
        console.log('[ExportOptions] Exporting to PDF');
        
        // Get the current images from the organizer grid
        const organizedGrid = document.getElementById('organizedGrid');
        if (organizedGrid && organizedGrid.__component && organizedGrid.__component.getCurrentImages) {
            const images = organizedGrid.__component.getCurrentImages();
            
            if (!images || images.length === 0) {
                alert('No images available to export');
                return;
            }
            
            // In a real implementation, this would generate a PDF with the images.
            // For now, we'll use the existing PDF export functionality if available.
            if (organizedGrid.__component.handleExportPdf) {
                organizedGrid.__component.handleExportPdf();
            } else {
                // Fallback to a simple alert
                alert('PDF export functionality is not available');
            }
            
            // Close the modal
            this.closeModal();
        } else {
            alert('No images available to export');
        }
    }
}
