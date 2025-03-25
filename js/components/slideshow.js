/**
 * Slideshow Component
 * Displays receipt images in a slideshow view with navigation
 */
import { createElement } from '../utils/uiUtils.js';
import { generateImagesPdf } from '../services/exportService.js';

export default class Slideshow {
    /**
     * Initialize the slideshow component
     * @param {Object} options - Configuration options
     * @param {string} options.slideshowId - ID of the slideshow modal element
     * @param {string} options.imageContainerId - ID of the slideshow image container
     * @param {string} options.prevBtnId - ID of the previous slide button
     * @param {string} options.nextBtnId - ID of the next slide button
     * @param {string} options.counterContainerId - ID of the slide counter container
     * @param {string} options.closeBtnClass - Class of the close button
     */
    constructor(options) {
        this.options = options;
        
        // DOM Elements
        this.slideshowView = document.getElementById(options.slideshowId);
        this.slideshowImageContainer = document.getElementById(options.imageContainerId);
        this.prevSlideBtn = document.getElementById(options.prevBtnId);
        this.nextSlideBtn = document.getElementById(options.nextBtnId);
        this.slideCounter = document.getElementById(options.counterContainerId);
        this.slideshowClose = document.querySelector(`.${options.closeBtnClass}`);
        
        // State
        this.currentSlideIndex = 0;
        this.currentDisplayedImages = [];
        this.allImages = []; // Store all images
        this.slideCounterInput = null;
        
        // Ensure required elements exist
        if (!this.slideshowView || !this.slideshowImageContainer) {
            console.error('Required elements not found for Slideshow');
            return;
        }
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Create toggle button for showing all images
        this.toggleAllImagesBtn = document.createElement('button');
        this.toggleAllImagesBtn.id = 'toggleAllImagesBtn';
        this.toggleAllImagesBtn.className = 'slide-nav-btn';
        this.toggleAllImagesBtn.textContent = 'Show All Images';
        this.toggleAllImagesBtn.style.marginLeft = '10px';
        
        // Create export options button (replaces direct PDF export)
        this.exportPdfBtn = document.createElement('button');
        this.exportPdfBtn.id = 'slideshowExportBtn';
        this.exportPdfBtn.className = 'slide-nav-btn';
        this.exportPdfBtn.textContent = 'Export to PDF';
        this.exportPdfBtn.style.marginLeft = '10px';
        
        // Add buttons to slideshow controls
        if (this.slideCounter && this.slideCounter.parentNode) {
            this.slideCounter.parentNode.appendChild(this.toggleAllImagesBtn);
            this.slideCounter.parentNode.appendChild(this.exportPdfBtn);
        }
        
        // Event Listeners
        if (this.prevSlideBtn) {
            this.prevSlideBtn.addEventListener('click', () => this.navigateSlideshow(-1));
        }
        
        if (this.nextSlideBtn) {
            this.nextSlideBtn.addEventListener('click', () => this.navigateSlideshow(1));
        }
        
        if (this.slideshowClose) {
            this.slideshowClose.addEventListener('click', this.closeSlideshow.bind(this));
        }
        
        // Add event listener for toggle button
        this.toggleAllImagesBtn.addEventListener('click', this.toggleAllImages.bind(this));
        
        // Add event listener for export options button
        this.exportPdfBtn.addEventListener('click', this.openExportOptionsModal.bind(this));
        
        // Add event listener for clicking outside the modal content to close
        this.slideshowView.addEventListener('click', (e) => {
            if (e.target === this.slideshowView) {
                this.closeSlideshow();
            }
        });
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard events when slideshow is visible
            if (this.slideshowView.style.display === 'block') {
                switch (e.key) {
                    case 'Escape':
                        this.closeSlideshow();
                        break;
                    case 'ArrowLeft':
                        this.navigateSlideshow(-1); // Previous slide
                        break;
                    case 'ArrowRight':
                        this.navigateSlideshow(1); // Next slide
                        break;
                }
            }
        });
        
        // Listen for slideshow:open event
        document.addEventListener('slideshow:open', (e) => {
            const { images, allImages, startIndex = 0 } = e.detail || {};
            this.openSlideshow(images, startIndex, allImages);
        });
        
        // Listen for slideshow:close event
        document.addEventListener('slideshow:close', () => {
            this.closeSlideshow();
        });
        
        // Listen for images:filtered event
        document.addEventListener('images:filtered', (e) => {
            const { images } = e.detail || {};
            console.log('[Slideshow] Received images:filtered event with', images ? images.length : 0, 'images');
            
            // Update the images regardless of whether slideshow is visible
            this.currentDisplayedImages = images || [];
            console.log('[Slideshow] Updated currentDisplayedImages array:', this.currentDisplayedImages);
            
            // If slideshow is currently open, reset to first image and update display
            if (this.slideshowView.style.display === 'block') {
                console.log('[Slideshow] Slideshow is visible, resetting to first image and updating display');
                this.currentSlideIndex = 0;
                this.displayCurrentSlide();
            } else {
                console.log('[Slideshow] Slideshow is not currently visible, images will be used when opened');
            }
        });
    }
    
    /**
     * Open the slideshow with the given images
     * @param {Array} images - Array of image data objects (filtered images)
     * @param {number} startIndex - Index of the image to start with
     * @param {Array} allImages - Array of all image data objects (unfiltered)
     */
    openSlideshow(images, startIndex = 0, allImages = null) {
        console.log('[Slideshow] openSlideshow called with', images ? images.length : 0, 'images and startIndex:', startIndex);
        
        if (!images || images.length === 0) {
            console.log('[Slideshow] No images provided, slideshow not opened');
            return;
        }
        
        console.log('[Slideshow] Setting currentDisplayedImages with', images.length, 'images');
        this.currentDisplayedImages = images;
        
        // Store all images if provided
        if (allImages && allImages.length > 0) {
            console.log('[Slideshow] Storing all images:', allImages.length);
            this.allImages = allImages;
            
            // Update toggle button text
            if (this.toggleAllImagesBtn) {
                if (this.allImages.length > this.currentDisplayedImages.length) {
                    this.toggleAllImagesBtn.textContent = `Show All Images (${this.allImages.length})`;
                    this.toggleAllImagesBtn.style.display = 'inline-block';
                } else {
                    this.toggleAllImagesBtn.style.display = 'none';
                }
            }
        } else {
            this.allImages = [...images];
            if (this.toggleAllImagesBtn) {
                this.toggleAllImagesBtn.style.display = 'none';
            }
        }
        
        this.currentSlideIndex = Math.min(Math.max(0, startIndex), images.length - 1);
        console.log('[Slideshow] Set currentSlideIndex to', this.currentSlideIndex);
        
        // Show the slideshow
        this.slideshowView.style.display = 'block';
        console.log('[Slideshow] Slideshow view displayed');
        
        // Display the current slide
        this.displayCurrentSlide();
    }
    
    /**
     * Close the slideshow
     */
    closeSlideshow() {
        this.slideshowView.style.display = 'none';
    }
    
    /**
     * Toggle between showing all images and showing only filtered images
     */
    toggleAllImages() {
        console.log('[Slideshow] Toggle all images button clicked');
        
        // If currently showing filtered images, switch to all images
        if (this.currentDisplayedImages.length < this.allImages.length) {
            console.log('[Slideshow] Switching to all images:', this.allImages.length);
            
            // Find the current image to maintain context when switching
            const currentImage = this.currentDisplayedImages[this.currentSlideIndex];
            
            // Find the index of the current image in the all images array
            let newIndex = 0;
            if (currentImage) {
                for (let i = 0; i < this.allImages.length; i++) {
                    if (this.allImages[i].image_url === currentImage.image_url) {
                        newIndex = i;
                        break;
                    }
                }
            }
            
            // Switch to all images
            this.currentDisplayedImages = this.allImages;
            this.currentSlideIndex = newIndex;
            
            // Update button text
            this.toggleAllImagesBtn.textContent = 'Show Filtered Images';
        } else {
            // Get the filtered images from the organizerGrid component
            const organizerGrid = document.getElementById('organizedGrid');
            if (organizerGrid && organizerGrid.__component && organizerGrid.__component.getCurrentImages) {
                const filteredImages = organizerGrid.__component.getCurrentImages();
                
                if (filteredImages && filteredImages.length > 0) {
                    console.log('[Slideshow] Switching to filtered images:', filteredImages.length);
                    
                    // Find the current image to maintain context when switching
                    const currentImage = this.currentDisplayedImages[this.currentSlideIndex];
                    
                    // Find the index of the current image in the filtered images array
                    let newIndex = 0;
                    if (currentImage) {
                        for (let i = 0; i < filteredImages.length; i++) {
                            if (filteredImages[i].image_url === currentImage.image_url) {
                                newIndex = i;
                                break;
                            }
                        }
                    }
                    
                    // Switch to filtered images
                    this.currentDisplayedImages = filteredImages;
                    this.currentSlideIndex = Math.min(newIndex, filteredImages.length - 1);
                    
                    // Update button text
                    this.toggleAllImagesBtn.textContent = `Show All Images (${this.allImages.length})`;
                }
            }
        }
        
        // Update the display
        this.displayCurrentSlide();
    }
    
    /**
     * Navigate to the previous or next slide
     * @param {number} direction - Direction to navigate (-1 for previous, 1 for next)
     */
    navigateSlideshow(direction) {
        if (!this.currentDisplayedImages || this.currentDisplayedImages.length === 0) {
            return;
        }
        
        // Calculate new index
        const newIndex = this.currentSlideIndex + direction;
        
        // Check if new index is valid
        if (newIndex >= 0 && newIndex < this.currentDisplayedImages.length) {
            this.currentSlideIndex = newIndex;
            this.displayCurrentSlide();
        }
    }
    
    /**
     * Create an editable slide counter
     * @returns {HTMLElement} - The counter container element
     */
    createEditableSlideCounter() {
        // Create container for the counter
        const counterContainer = createElement('div', {
            className: 'slide-counter-container',
            style: {
                display: 'flex',
                alignItems: 'center'
            }
        });
        
        // Create input for current slide
        this.slideCounterInput = createElement('input', {
            type: 'number',
            min: '1',
            max: this.currentDisplayedImages.length.toString(),
            value: (this.currentSlideIndex + 1).toString(),
            style: {
                width: '50px',
                textAlign: 'center',
                margin: '0 5px',
                padding: '3px',
                border: '1px solid #ccc',
                borderRadius: '4px'
            },
            onChange: () => {
                let newIndex = parseInt(this.slideCounterInput.value) - 1;
                
                // Validate the input
                if (isNaN(newIndex) || newIndex < 0) {
                    newIndex = 0;
                } else if (newIndex >= this.currentDisplayedImages.length) {
                    newIndex = this.currentDisplayedImages.length - 1;
                }
                
                // Update the input value to reflect valid number
                this.slideCounterInput.value = (newIndex + 1).toString();
                
                // Jump to the specified slide
                if (newIndex !== this.currentSlideIndex) {
                    this.currentSlideIndex = newIndex;
                    this.displayCurrentSlide();
                }
            }
        });
        
        // Create text for "of X" part
        const totalText = createElement('span', {}, ` of ${this.currentDisplayedImages.length}`);
        
        // Assemble the counter
        counterContainer.appendChild(document.createTextNode('Image '));
        counterContainer.appendChild(this.slideCounterInput);
        counterContainer.appendChild(totalText);
        
        return counterContainer;
    }
    
    /**
     * Display the current slide
     */
    displayCurrentSlide() {
        if (!this.currentDisplayedImages || this.currentDisplayedImages.length === 0) {
            return;
        }
        
        // Get current image data
        const currentImage = this.currentDisplayedImages[this.currentSlideIndex];
        
        // Update slide counter
        if (this.slideCounterInput) {
            this.slideCounterInput.value = (this.currentSlideIndex + 1).toString();
            this.slideCounterInput.max = this.currentDisplayedImages.length.toString();
        } else if (this.slideCounter) {
            // Replace the static counter with an editable one
            const counterContainer = this.createEditableSlideCounter();
            this.slideCounter.innerHTML = '';
            this.slideCounter.appendChild(counterContainer);
        }
        
        // Update navigation button states
        if (this.prevSlideBtn) {
            this.prevSlideBtn.disabled = this.currentSlideIndex === 0;
        }
        
        if (this.nextSlideBtn) {
            this.nextSlideBtn.disabled = this.currentSlideIndex === this.currentDisplayedImages.length - 1;
        }
        
        // Clear the slideshow container
        this.slideshowImageContainer.innerHTML = '';
        
        // Create slideshow content
        const slideshowContent = createElement('div', {
            className: 'slideshow-content'
        });
        
        // Add customer name
        const customerName = createElement('div', {
            className: 'customer-name'
        }, currentImage.customer_name ? currentImage.customer_name.toUpperCase() : 'N/A');
        slideshowContent.appendChild(customerName);
        
        // Add image container
        const imageContainer = createElement('div', {
            className: 'image-container'
        });
        
        // Create a colored rectangle as a fallback image
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
        const color = colors[this.currentSlideIndex % colors.length];
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 300, 200);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Receipt Image ${this.currentSlideIndex + 1}`, 150, 100);
        
        // Convert to data URL
        const fallbackImageUrl = canvas.toDataURL('image/png');
        
        // Add receipt image
        const receiptImage = createElement('img', {
            className: 'receipt-image',
            src: currentImage.image_url || fallbackImageUrl,
            alt: 'Receipt Image'
        });
        imageContainer.appendChild(receiptImage);
        
        slideshowContent.appendChild(imageContainer);
        
        // Add receipt details
        const receiptDetails = createElement('div', {
            className: 'receipt-details'
        });
        
        // Create a table for the receipt data (similar to the table view)
        const dataTable = createElement('table', {
            className: 'slideshow-data-table'
        });
        
        // Create table header
        const tableHeader = createElement('thead');
        const headerRow = createElement('tr');
        
        // Define the columns to match the table view
        const columns = [
            { label: 'Date', field: 'date' },
            { label: 'Time', field: 'time' },
            { label: 'Customer Name', field: 'customer_name' },
            { label: 'Check #', field: 'check_number' },
            { label: 'Amount', field: 'amount' },
            { label: 'Payment Type', field: 'payment_type' }
        ];
        
        // Add tip and total if they exist
        if (currentImage.hasOwnProperty('tip')) {
            columns.push({ label: 'Tip', field: 'tip' });
        }
        
        if (currentImage.hasOwnProperty('total')) {
            columns.push({ label: 'Total', field: 'total' });
        }
        
        // Add signed status if it exists
        if (currentImage.hasOwnProperty('signed')) {
            columns.push({ label: 'Signed', field: 'signed' });
        }
        
        // Create header cells
        columns.forEach(column => {
            const th = createElement('th', {}, column.label);
            headerRow.appendChild(th);
        });
        
        tableHeader.appendChild(headerRow);
        dataTable.appendChild(tableHeader);
        
        // Create table body
        const tableBody = createElement('tbody');
        const dataRow = createElement('tr');
        
        // Create data cells
        columns.forEach(column => {
            let value = currentImage[column.field];
            
            // Format boolean values
            if (column.field === 'signed' && typeof value === 'boolean') {
                value = value ? 'Yes' : 'No';
            }
            
            const td = createElement('td', {}, value || 'N/A');
            dataRow.appendChild(td);
        });
        
        tableBody.appendChild(dataRow);
        dataTable.appendChild(tableBody);
        
        // Add the table to the receipt details
        receiptDetails.appendChild(dataTable);
        slideshowContent.appendChild(receiptDetails);
        
        // Add the slideshow content to the container
        this.slideshowImageContainer.appendChild(slideshowContent);
    }
    
    /**
     * Get the current slide index
     * @returns {number} - The current slide index
     */
    getCurrentIndex() {
        return this.currentSlideIndex;
    }
    
    /**
     * Get the current images
     * @returns {Array} - Array of current image data objects
     */
    getCurrentImages() {
        return this.currentDisplayedImages;
    }
    
    /**
     * Check if the slideshow is open
     * @returns {boolean} - Whether the slideshow is open
     */
    isOpen() {
        return this.slideshowView.style.display === 'block';
    }
    
    /**
     * Jump to a specific slide
     * @param {number} index - The index to jump to
     */
    jumpToSlide(index) {
        if (!this.currentDisplayedImages || this.currentDisplayedImages.length === 0) {
            return;
        }
        
        // Validate the index
        if (index >= 0 && index < this.currentDisplayedImages.length) {
            this.currentSlideIndex = index;
            this.displayCurrentSlide();
        }
    }
    
    /**
     * Open the export options modal
     */
    openExportOptionsModal() {
        console.log('[Slideshow] Export button clicked, opening export options modal');
        
        // Get the images to export
        const imagesToExport = this.currentDisplayedImages;
        
        if (imagesToExport.length === 0) {
            console.log('[Slideshow] No images to export');
            alert('No images available to export');
            return;
        }
        
        // Store the current images in a data attribute on the grid component
        // This allows the export options component to access the slideshow images
        const organizerGrid = document.getElementById('organizedGrid');
        if (organizerGrid && organizerGrid.__component) {
            // Temporarily store the slideshow images for export
            organizerGrid.__component.temporarySlideshowImages = imagesToExport;
            
            // Dispatch a custom event to open the export options modal
            const exportOptionsModal = document.getElementById('exportOptionsModal');
            if (exportOptionsModal) {
                // Create and dispatch the event
                const event = new CustomEvent('exportOptions:open', {
                    detail: { source: 'slideshow' }
                });
                document.dispatchEvent(event);
            } else {
                console.error('[Slideshow] Export options modal not found');
                alert('Export options are not available');
            }
        } else {
            console.error('[Slideshow] Organizer grid component not found');
            alert('Export options are not available');
        }
    }
    
    /**
     * Handle direct PDF export (used when called from other components)
     */
    handleExportPdf() {
        console.log('[Slideshow] Direct PDF export requested');
        
        // Determine which images to export (current view or all)
        const imagesToExport = this.currentDisplayedImages;
        
        if (imagesToExport.length === 0) {
            console.log('[Slideshow] No images to export');
            return;
        }
        
        console.log(`[Slideshow] Exporting ${imagesToExport.length} images to PDF`);
        
        // Generate PDF with the images using portrait orientation for better image display
        generateImagesPdf(imagesToExport, 'slideshow_images.pdf', {
            orientation: 'portrait',
            format: 'a4',
            imageQuality: 0.9
        });
    }
}
