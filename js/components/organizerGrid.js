/**
 * Organizer Grid Component
 * Displays processed receipt images in a grid layout with filtering
 */
import { filterReceiptData, sortReceiptData } from '../utils/dataUtils.js';
import { createElement } from '../utils/uiUtils.js';
import { generateImagesPdf } from '../services/exportService.js';
import config from '../config.js';

export default class OrganizerGrid {
    /**
     * Initialize the organizer grid component
     * @param {Object} options - Configuration options
     * @param {string} options.gridId - ID of the grid container element
     * @param {string} options.filterFieldId - ID of the filter field select element
     * @param {string} options.filterValueId - ID of the filter value input element
     * @param {string} options.applyFilterBtnId - ID of the apply filter button
     * @param {string} options.clearFilterBtnId - ID of the clear filter button
     * @param {string} options.gridViewBtnId - ID of the grid view button
     * @param {string} options.slideshowViewBtnId - ID of the slideshow view button
     * @param {Function} options.onImageClick - Callback when an image is clicked
     */
    constructor(options) {
        this.options = options;
        
        // DOM Elements
        this.grid = document.getElementById(options.gridId);
        this.filterField = document.getElementById(options.filterFieldId);
        this.filterValue = document.getElementById(options.filterValueId);
        this.filterSortOrder = document.getElementById('filterSortOrder');
        this.applyFilterBtn = document.getElementById(options.applyFilterBtnId);
        this.clearFilterBtn = document.getElementById(options.clearFilterBtnId);
        this.gridViewBtn = document.getElementById(options.gridViewBtnId);
        this.slideshowViewBtn = document.getElementById(options.slideshowViewBtnId);
        
        // Data
        this.allImages = [];
        this.currentDisplayedImages = [];
        
        // Ensure required elements exist
        if (!this.grid) {
            console.error('Required elements not found for OrganizerGrid');
            return;
        }
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Set default filter field
        if (this.filterField) {
            this.filterField.value = config.ui.defaultFilterField;
        }
        
        // Event Listeners
        if (this.applyFilterBtn) {
            this.applyFilterBtn.addEventListener('click', this.handleFilter.bind(this));
        }
        
        if (this.clearFilterBtn) {
            this.clearFilterBtn.addEventListener('click', this.handleClearFilter.bind(this));
        }
        
        if (this.filterValue) {
            this.filterValue.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleFilter();
                }
            });
        }
        
        if (this.gridViewBtn) {
            this.gridViewBtn.addEventListener('click', () => this.setViewMode('grid'));
        }
        
        if (this.slideshowViewBtn) {
            this.slideshowViewBtn.addEventListener('click', () => this.setViewMode('slideshow'));
        }
        
        // Add event listener for Export PDF button
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', this.handleExportPdf.bind(this));
        }
        
        // Show empty state initially
        this.showEmptyState();
    }
    
    /**
     * Set the view mode (grid or slideshow)
     * @param {string} mode - The view mode ('grid' or 'slideshow')
     */
    setViewMode(mode) {
        if (mode === 'grid') {
            console.log('[OrganizerGrid] Switching to grid view mode');
            
            // Update button states
            if (this.gridViewBtn) this.gridViewBtn.classList.add('active');
            if (this.slideshowViewBtn) this.slideshowViewBtn.classList.remove('active');
            
            // Show grid
            if (this.grid) this.grid.style.display = 'grid';
            
            // Trigger slideshow close event
            console.log('[OrganizerGrid] Dispatching slideshow:close event');
            const event = new CustomEvent('slideshow:close');
            document.dispatchEvent(event);
        } else if (mode === 'slideshow') {
            console.log('[OrganizerGrid] Switching to slideshow view mode');
            console.log('[OrganizerGrid] Current displayed images count:', this.currentDisplayedImages.length);
            console.log('[OrganizerGrid] All images count:', this.allImages.length);
            
            // Update button states
            if (this.gridViewBtn) this.gridViewBtn.classList.remove('active');
            if (this.slideshowViewBtn) this.slideshowViewBtn.classList.add('active');
            
            // Keep grid visible behind modal
            if (this.grid) this.grid.style.display = 'grid';
            
            // Trigger slideshow open event with the currently filtered images and all images
            console.log('[OrganizerGrid] Dispatching slideshow:open event with', this.currentDisplayedImages.length, 'filtered images and', this.allImages.length, 'total images');
            const event = new CustomEvent('slideshow:open', {
                detail: { 
                    images: this.currentDisplayedImages,
                    allImages: this.allImages,
                    startIndex: 0
                }
            });
            document.dispatchEvent(event);
        }
    }
    
    /**
     * Handle filter button click
     */
    handleFilter() {
        const field = this.filterField.value;
        const value = this.filterValue.value.trim().toLowerCase();
        const sortOrder = this.filterSortOrder.value;
        
        console.log(`[OrganizerGrid] Filter button clicked - Field: ${field}, Value: "${value}", Sort Order: ${sortOrder}`);
        console.log('[OrganizerGrid] All images count:', this.allImages ? this.allImages.length : 0);
        
        if (!this.allImages || this.allImages.length === 0) {
            console.log('[OrganizerGrid] Filter not applied: No images to filter');
            return;
        }
        
        // Even if value is empty, we'll apply the filter (which will match all items)
        console.log(`[OrganizerGrid] Applying filter - Field: ${field}, Value: "${value}"`);
        
        // Filter the images based on the selected field and value
        // If value is empty, it will return all images
        let filteredImages = value ? 
            filterReceiptData(this.allImages, field, value) : 
            [...this.allImages];
        
        console.log('[OrganizerGrid] Filtered images count:', filteredImages.length);
        
        // Sort the filtered images by the filter field
        if (filteredImages.length > 0) {
            console.log(`[OrganizerGrid] Sorting filtered images by field: ${field}, order: ${sortOrder}`);
            
            // Sort by the filter field using the selected sort order
            filteredImages = sortReceiptData(filteredImages, field, sortOrder);
            
            console.log('[OrganizerGrid] Images sorted');
        }
        
        this.currentDisplayedImages = filteredImages;
        
        // Display the filtered and sorted images
        this.displayImages(this.currentDisplayedImages);
        
        // Trigger filtered event with sorted images
        console.log('[OrganizerGrid] Dispatching images:filtered event with', this.currentDisplayedImages.length, 'sorted images');
        const event = new CustomEvent('images:filtered', {
            detail: { 
                images: this.currentDisplayedImages,
                filterField: field,
                filterValue: value
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Handle clear filter button click
     */
    handleClearFilter() {
        console.log('[OrganizerGrid] Clearing filter');
        
        if (this.filterValue) this.filterValue.value = '';
        
        // Get the current filter field and sort order
        const field = this.filterField.value;
        const sortOrder = this.filterSortOrder.value;
        console.log(`[OrganizerGrid] Current filter field: ${field}, sort order: ${sortOrder}`);
        
        // Sort all images by the current filter field and sort order
        let sortedImages = [...this.allImages];
        if (sortedImages.length > 0) {
            console.log(`[OrganizerGrid] Sorting all images by field: ${field}, order: ${sortOrder}`);
            sortedImages = sortReceiptData(sortedImages, field, sortOrder);
            console.log('[OrganizerGrid] Images sorted');
        }
        
        this.currentDisplayedImages = sortedImages;
        
        console.log('[OrganizerGrid] Reset to all sorted images, count:', this.currentDisplayedImages.length);
        
        // Display all sorted images
        this.displayImages(this.currentDisplayedImages);
        
        // Trigger filtered event with sorted images
        console.log('[OrganizerGrid] Dispatching images:filtered event with all sorted images');
        const event = new CustomEvent('images:filtered', {
            detail: { 
                images: this.currentDisplayedImages,
                filterField: field,
                filterValue: ''
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Set the images to display
     * @param {Array} images - Array of image data objects
     */
    setImages(images) {
        if (!images || !Array.isArray(images)) {
            this.allImages = [];
            this.currentDisplayedImages = [];
            this.showEmptyState();
            return;
        }
        
        console.log('[OrganizerGrid] Setting images, count:', images.length);
        
        // Store the original images
        this.allImages = images;
        
        // Get the current filter field and sort order
        const field = this.filterField ? this.filterField.value : config.ui.defaultFilterField;
        const sortOrder = this.filterSortOrder ? this.filterSortOrder.value : 'asc';
        console.log(`[OrganizerGrid] Current filter field for initial sort: ${field}, sort order: ${sortOrder}`);
        
        // Sort the images by the current filter field and sort order
        if (images.length > 0) {
            console.log(`[OrganizerGrid] Sorting initial images by field: ${field}, order: ${sortOrder}`);
            this.currentDisplayedImages = sortReceiptData([...images], field, sortOrder);
            console.log('[OrganizerGrid] Initial images sorted');
        } else {
            this.currentDisplayedImages = [...images];
        }
        
        // Display the sorted images
        this.displayImages(this.currentDisplayedImages);
    }
    
    /**
     * Display images in the grid
     * @param {Array} images - Array of image data objects to display
     */
    displayImages(images) {
        // Clear the grid
        this.grid.innerHTML = '';
        
        if (!images || images.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Create grid items for each image
        images.forEach((image, index) => {
            const gridItem = this.createGridItem(image, index);
            this.grid.appendChild(gridItem);
        });
    }
    
    /**
     * Create a grid item for an image
     * @param {Object} image - The image data object
     * @param {number} index - The index of the image in the array
     * @returns {HTMLElement} - The created grid item element
     */
    createGridItem(image, index) {
        const gridItem = createElement('div', {
            className: 'grid-item',
            dataset: { index }
        });
        
        // Create image container
        const imageContainer = createElement('div', {
            className: 'grid-image-container'
        });
        
        // Create a colored rectangle as a fallback image
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
        const color = colors[index % colors.length];
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 300, 200);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Receipt Image ${index + 1}`, 150, 100);
        
        // Convert to data URL
        const fallbackImageUrl = canvas.toDataURL('image/png');
        
        // Add receipt image
        const receiptImage = createElement('img', {
            className: 'grid-receipt-image',
            src: image.image_url || fallbackImageUrl,
            alt: 'Receipt Image'
        });
        
        // Add customer name overlay
        const customerName = createElement('div', {
            className: 'grid-customer-name'
        }, image.customer_name ? image.customer_name.toUpperCase() : 'N/A');
        
        imageContainer.appendChild(receiptImage);
        imageContainer.appendChild(customerName);
        
        gridItem.appendChild(imageContainer);
        
        // Add receipt details
        const receiptDetails = createElement('div', {
            className: 'grid-receipt-details'
        });
        
        // Add date and time
        const dateTime = createElement('div', {
            className: 'grid-date-time'
        });
        
        dateTime.appendChild(
            createElement('div', { className: 'grid-date' }, image.date || 'N/A')
        );
        
        dateTime.appendChild(
            createElement('div', { className: 'grid-time' }, image.time || 'N/A')
        );
        
        receiptDetails.appendChild(dateTime);
        
        // Add amount info
        const amountInfo = createElement('div', {
            className: 'grid-amount-info'
        });
        
        amountInfo.appendChild(
            createElement('div', { className: 'grid-amount' }, `Amount: ${image.amount || 'N/A'}`)
        );
        
        amountInfo.appendChild(
            createElement('div', { className: 'grid-tip' }, `Tip: ${image.tip || 'N/A'}`)
        );
        
        amountInfo.appendChild(
            createElement('div', { className: 'grid-total' }, `Total: ${image.total || 'N/A'}`)
        );
        
        receiptDetails.appendChild(amountInfo);
        
        gridItem.appendChild(receiptDetails);
        
        // Add click event to open slideshow at this image
        gridItem.addEventListener('click', () => {
            if (this.options.onImageClick) {
                this.options.onImageClick(image, index);
            } else {
                // Default behavior: open slideshow
                const event = new CustomEvent('slideshow:open', {
                    detail: { 
                        images: this.currentDisplayedImages,
                        allImages: this.allImages,
                        startIndex: index
                    }
                });
                document.dispatchEvent(event);
            }
        });
        
        return gridItem;
    }
    
    /**
     * Show empty state when no images are available
     */
    showEmptyState() {
        this.grid.innerHTML = '';
        
        const emptyState = createElement('div', {
            className: 'empty-state'
        });
        
        emptyState.appendChild(
            createElement('p', {}, 'No images have been processed yet. Use the Scanner tab to process images first.')
        );
        
        this.grid.appendChild(emptyState);
    }
    
    /**
     * Get all images
     * @returns {Array} - Array of all image data objects
     */
    getAllImages() {
        return this.allImages;
    }
    
    /**
     * Get currently displayed images
     * @returns {Array} - Array of currently displayed image data objects
     */
    getCurrentImages() {
        return this.currentDisplayedImages;
    }
    
    /**
     * Clear all images
     */
    clear() {
        this.allImages = [];
        this.currentDisplayedImages = [];
        this.showEmptyState();
    }
    
    /**
     * Handle Export PDF button click
     */
    handleExportPdf() {
        console.log('[OrganizerGrid] Export PDF button clicked');
        
        // Determine which images to export (filtered or all)
        const imagesToExport = this.currentDisplayedImages.length > 0 ? 
            this.currentDisplayedImages : this.allImages;
        
        if (imagesToExport.length === 0) {
            console.log('[OrganizerGrid] No images to export');
            return;
        }
        
        console.log(`[OrganizerGrid] Exporting ${imagesToExport.length} images to PDF`);
        
        // Generate PDF with the images using portrait orientation for better image display
        generateImagesPdf(imagesToExport, 'receipt_images.pdf', {
            orientation: 'portrait',
            format: 'a4',
            imageQuality: 0.9
        });
    }
}
