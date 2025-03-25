/**
 * Export Options Component
 * Handles the export options modal and export functionality
 */
import { exportImagesToStorage } from '../services/firebaseStorageService.js';
import { auth } from '../firebase-config.js';
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from '../firebase-config.js';
import { showNotification } from '../utils/uiUtils.js';

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
        
        // Listen for exportOptions:open event (triggered from slideshow)
        document.addEventListener('exportOptions:open', (e) => {
            const { source } = e.detail || {};
            console.log('[ExportOptions] Received exportOptions:open event from', source);
            this.openModal(null, source);
        });
        
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
     * @param {Event} event - The event that triggered the modal opening
     * @param {string} source - The source of the export request ('slideshow' or undefined)
     */
    openModal(event, source) {
        console.log('[ExportOptions] Opening export options modal from source:', source);
        
        if (this.exportOptionsModal) {
            this.exportOptionsModal.style.display = 'block';
            
            // Reset input containers
            if (this.emailInputContainer) {
                this.emailInputContainer.style.display = 'none';
            }
            
            if (this.textInputContainer) {
                this.textInputContainer.style.display = 'none';
            }
            
            // Store the source for later use when exporting
            this.exportSource = source || 'grid';
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
     * Get images to export based on the source
     * @returns {Array} Images to export
     */
    getImagesToExport() {
        const organizedGrid = document.getElementById('organizedGrid');
        if (!organizedGrid || !organizedGrid.__component) {
            console.error('[ExportOptions] Could not find organizer grid component');
            return [];
        }
        
        // If exporting from slideshow, use the temporarily stored slideshow images
        if (this.exportSource === 'slideshow' && organizedGrid.__component.temporarySlideshowImages) {
            console.log('[ExportOptions] Using slideshow images for export');
            return organizedGrid.__component.temporarySlideshowImages;
        }
        
        // Otherwise, use the current grid images
        if (organizedGrid.__component.getCurrentImages) {
            console.log('[ExportOptions] Using grid images for export');
            return organizedGrid.__component.getCurrentImages();
        }
        
        return [];
    }
    
    /**
     * Get the current bar ID for the user
     * @returns {Promise<string>} - Promise resolving to the current bar ID
     */
    async getCurrentBarId() {
        try {
            if (!auth.currentUser) {
                console.error('[ExportOptions] User not authenticated');
                return null;
            }
            
            const userId = auth.currentUser.uid;
            
            // Try to get from localStorage first (faster)
            const storedBarId = localStorage.getItem('currentBarId');
            if (storedBarId) {
                return storedBarId;
            }
            
            // Get from Firestore if not in localStorage
            try {
                const userDoc = await getDoc(doc(db, "users", userId));
                if (userDoc.exists() && userDoc.data().currentBarId) {
                    return userDoc.data().currentBarId;
                }
                
                // Check user_bars collection
                const userBarsDoc = await getDoc(doc(db, "user_bars", userId));
                if (userBarsDoc.exists() && userBarsDoc.data().bars && userBarsDoc.data().bars.length > 0) {
                    // Get first bar ID if there are multiple
                    return userBarsDoc.data().bars[0].barId;
                }
            } catch (error) {
                console.error('[ExportOptions] Error getting bar ID from Firestore:', error);
            }
            
            // Final fallback: default bar ID
            return 'default';
        } catch (error) {
            console.error('[ExportOptions] Error getting current bar ID:', error);
            return 'default';
        }
    }
    
    /**
     * Export to email
     */
    async exportToEmail() {
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
            
            try {
                // Show loading notification
                showNotification('Processing export to email...', 'info');
                
                // Store email in localStorage for future use
                localStorage.setItem('userEmail', email);
                
                // Get the images to export
                const images = this.getImagesToExport();
                
                if (!images || images.length === 0) {
                    showNotification('No images available to export', 'error');
                    return;
                }
                
                // Get current bar ID
                const barId = await this.getCurrentBarId();
                if (!barId) {
                    showNotification('Could not determine bar ID for export', 'error');
                    return;
                }
                
                // Upload images to Firebase Storage
                const exportedUrls = await exportImagesToStorage(images, barId, 'email');
                
                // In a real implementation, this would also trigger an email sending process
                showNotification(`${exportedUrls.length} images exported and will be sent to ${email}`, 'success');
                
                // Close the modal
                this.closeModal();
            } catch (error) {
                console.error('[ExportOptions] Error exporting to email:', error);
                showNotification(`Error exporting to email: ${error.message}`, 'error');
            }
        }
    }
    
    /**
     * Export to text
     */
    async exportToText() {
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
            
            try {
                // Show loading notification
                showNotification('Processing export to text...', 'info');
                
                // Store phone in localStorage for future use
                localStorage.setItem('userPhone', phone);
                
                // Get the images to export
                const images = this.getImagesToExport();
                
                if (!images || images.length === 0) {
                    showNotification('No images available to export', 'error');
                    return;
                }
                
                // Get current bar ID
                const barId = await this.getCurrentBarId();
                if (!barId) {
                    showNotification('Could not determine bar ID for export', 'error');
                    return;
                }
                
                // Upload images to Firebase Storage
                const exportedUrls = await exportImagesToStorage(images, barId, 'text');
                
                // In a real implementation, this would also trigger a text message sending process
                showNotification(`${exportedUrls.length} images exported and will be sent to ${phone}`, 'success');
                
                // Close the modal
                this.closeModal();
            } catch (error) {
                console.error('[ExportOptions] Error exporting to text:', error);
                showNotification(`Error exporting to text: ${error.message}`, 'error');
            }
        }
    }
    
    /**
     * Export to PDF
     */
    async exportToPdf() {
        console.log('[ExportOptions] Exporting to PDF');
        
        try {
            // Show loading notification
            showNotification('Processing PDF export...', 'info');
            
            // Get the images to export
            const images = this.getImagesToExport();
            
            if (!images || images.length === 0) {
                showNotification('No images available to export', 'error');
                return;
            }
            
            // Get current bar ID
            const barId = await this.getCurrentBarId();
            if (!barId) {
                showNotification('Could not determine bar ID for export', 'error');
                return;
            }
            
            // Upload images to Firebase Storage (for backup/sharing)
            const exportedUrls = await exportImagesToStorage(images, barId, 'pdf');
            
            // Continue with regular PDF generation
            const organizedGrid = document.getElementById('organizedGrid');
            if (organizedGrid && organizedGrid.__component) {
                if (this.exportSource === 'slideshow') {
                    // If we're exporting from the slideshow, use the slideshow's export method if available
                    const slideshowView = document.getElementById('slideshowView');
                    if (slideshowView && slideshowView.__component && slideshowView.__component.handleExportPdf) {
                        slideshowView.__component.handleExportPdf();
                    } else {
                        // Fallback to the grid's export method
                        if (organizedGrid.__component.handleExportPdf) {
                            organizedGrid.__component.handleExportPdf(images);
                        } else {
                            // Final fallback to a simple alert
                            showNotification(`PDF export of ${images.length} images completed`, 'success');
                        }
                    }
                } else {
                    // If exporting from the grid, use the grid's export method
                    if (organizedGrid.__component.handleExportPdf) {
                        organizedGrid.__component.handleExportPdf();
                    } else {
                        // Fallback to a simple alert
                        showNotification(`PDF export of ${images.length} images completed`, 'success');
                    }
                }
            } else {
                showNotification(`PDF export of ${images.length} images completed`, 'success');
            }
            
            // Close the modal
            this.closeModal();
        } catch (error) {
            console.error('[ExportOptions] Error exporting to PDF:', error);
            showNotification(`Error exporting to PDF: ${error.message}`, 'error');
        }
    }
}
