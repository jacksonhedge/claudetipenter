/**
 * Organizer Grid Component for "Organized Images without Tip" tab
 * Handles displaying and filtering organized images without tip information
 */
import Slideshow from './slideshow.js';

export default class OrganizerGridNoTip {
    /**
     * Convert time string to a sortable 24-hour format
     * @param {string} timeStr - Time string (e.g., "3:45 PM", "15:45")
     * @param {string} dateStr - Optional date string to combine with time for cross-day sorting
     * @returns {number} - Minutes since epoch or midnight for easy comparison
     */
    convertTimeToSortableFormat(timeStr, dateStr) {
        if (!timeStr || timeStr === 'N/A') return 0;
        
        try {
            // Handle various time formats
            let hours = 0;
            let minutes = 0;
            let isPM = false;
            
            // Check if time has AM/PM
            if (timeStr.toLowerCase().includes('pm')) {
                isPM = true;
                timeStr = timeStr.toLowerCase().replace('pm', '').trim();
            } else if (timeStr.toLowerCase().includes('am')) {
                timeStr = timeStr.toLowerCase().replace('am', '').trim();
            }
            
            // Split hours and minutes
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                hours = parseInt(parts[0], 10) || 0;
                minutes = parseInt(parts[1], 10) || 0;
                
                // Convert to 24-hour format if PM
                if (isPM && hours < 12) {
                    hours += 12;
                }
                // Handle 12 AM as 0 hours
                if (!isPM && hours === 12) {
                    hours = 0;
                }
            }
            
            // If date is provided, create a combined date-time value for cross-day sorting
            if (dateStr && dateStr !== 'N/A') {
                try {
                    // Parse the date
                    const dateParts = dateStr.split(/[\/\-]/);
                    let year, month, day;
                    
                    if (dateStr.includes('/')) {
                        // MM/DD/YYYY format
                        month = parseInt(dateParts[0], 10) - 1; // JS months are 0-indexed
                        day = parseInt(dateParts[1], 10);
                        year = parseInt(dateParts[2], 10);
                        if (year < 100) year += 2000; // Handle 2-digit years
                    } else if (dateStr.includes('-')) {
                        // YYYY-MM-DD format
                        year = parseInt(dateParts[0], 10);
                        month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
                        day = parseInt(dateParts[2], 10);
                    } else {
                        // If format is unknown, just use minutes since midnight
                        return hours * 60 + minutes;
                    }
                    
                    // Create a date object with the combined date and time
                    const date = new Date(year, month, day, hours, minutes, 0);
                    
                    // Return milliseconds since epoch for absolute chronological sorting
                    return date.getTime();
                } catch (dateError) {
                    console.error('Error parsing date for time sorting:', dateError);
                    // Fall back to minutes since midnight
                    return hours * 60 + minutes;
                }
            } else {
                // If no date provided, return minutes since midnight
                return hours * 60 + minutes;
            }
        } catch (error) {
            console.error('Error parsing time:', error);
            return 0;
        }
    }
    
    /**
     * Convert date string to a sortable format (YYYY-MM-DD)
     * @param {string} dateStr - Date string (e.g., "03/17/2025", "2025-03-17")
     * @returns {string} - Sortable date string
     */
    convertDateToSortableFormat(dateStr) {
        if (!dateStr || dateStr === 'N/A') return '';
        
        try {
            // Handle various date formats
            let year, month, day;
            
            // Check if date is in MM/DD/YYYY format
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length >= 3) {
                    month = parts[0].padStart(2, '0');
                    day = parts[1].padStart(2, '0');
                    year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                    return `${year}-${month}-${day}`;
                }
            } 
            // Check if date is in YYYY-MM-DD format
            else if (dateStr.includes('-')) {
                // Already in sortable format
                return dateStr;
            }
            
            // If we can't parse it, create a Date object and format it
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                year = date.getFullYear();
                month = (date.getMonth() + 1).toString().padStart(2, '0');
                day = date.getDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            
            // If all else fails, return the original string
            return dateStr;
        } catch (error) {
            console.error('Error parsing date:', error);
            return dateStr;
        }
    }
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
     */
    constructor(options) {
        this.options = options;
        
        // DOM Elements
        this.gridContainer = document.getElementById(options.gridId);
        this.filterField = document.getElementById(options.filterFieldId);
        this.filterValue = document.getElementById(options.filterValueId);
        this.filterSortOrder = document.getElementById(options.filterSortOrderId);
        this.applyFilterBtn = document.getElementById(options.applyFilterBtnId);
        this.clearFilterBtn = document.getElementById(options.clearFilterBtnId);
        this.gridViewBtn = document.getElementById(options.gridViewBtnId);
        this.slideshowViewBtn = document.getElementById(options.slideshowViewBtnId);
        this.exportPdfBtn = document.getElementById(options.exportPdfBtnId);
        
        // Data
        this.images = [];
        this.filteredImages = [];
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Add event listeners
        if (this.applyFilterBtn) {
            this.applyFilterBtn.addEventListener('click', this.handleFilter.bind(this));
        }
        
        if (this.clearFilterBtn) {
            this.clearFilterBtn.addEventListener('click', this.handleClearFilter.bind(this));
        }
        
        if (this.slideshowViewBtn) {
            this.slideshowViewBtn.addEventListener('click', this.handleSlideshowView.bind(this));
        }
        
        if (this.exportPdfBtn) {
            this.exportPdfBtn.addEventListener('click', this.handleExportPdf.bind(this));
        }
    }
    
    /**
     * Set the images to display in the grid
     * @param {Array} images - Array of image objects
     */
    setImages(images) {
        this.images = images;
        
        // Get the current filter field and sort order for initial sorting
        const field = this.filterField ? this.filterField.value : 'customer_name';
        const sortOrder = this.filterSortOrder ? this.filterSortOrder.value : 'asc';
        
        // Apply initial sorting
        this.filteredImages = [...images];
        
        // Sort the images by the current filter field and sort order
        if (this.filteredImages.length > 0) {
            this.filteredImages.sort((a, b) => {
                let valueA = a[field] || '';
                let valueB = b[field] || '';
                
                // Handle different field types for proper sorting
                if (field === 'amount') {
                    // Parse amount as number, removing currency symbols and non-numeric characters
                    valueA = parseFloat(String(valueA).replace(/[^\d.-]/g, '') || 0);
                    valueB = parseFloat(String(valueB).replace(/[^\d.-]/g, '') || 0);
                } else if (field === 'time') {
                    // Convert time to comparable format (24-hour) with date for cross-day sorting
                    valueA = this.convertTimeToSortableFormat(String(valueA), a.date);
                    valueB = this.convertTimeToSortableFormat(String(valueB), b.date);
                } else if (field === 'date') {
                    // Convert date to sortable format (YYYY-MM-DD)
                    valueA = this.convertDateToSortableFormat(String(valueA));
                    valueB = this.convertDateToSortableFormat(String(valueB));
                } else {
                    // Convert to lowercase for string comparison
                    valueA = String(valueA).toLowerCase();
                    valueB = String(valueB).toLowerCase();
                }
                
                // Compare values
                if (valueA < valueB) {
                    return sortOrder === 'asc' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return sortOrder === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        this.renderGrid();
    }
    
    /**
     * Render the grid with the current images
     */
    renderGrid() {
        if (!this.gridContainer) return;
        
        // Clear the grid
        this.gridContainer.innerHTML = '';
        
        // If no images, show empty state
        if (this.filteredImages.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = '<p>No images have been processed yet. Use the File Organizer tab to process images first.</p>';
            this.gridContainer.appendChild(emptyState);
            return;
        }
        
        // Create grid items for each image
        this.filteredImages.forEach((image, index) => {
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';
            gridItem.dataset.index = index;
            
            // Create image container
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            
            // Create image element
            const img = document.createElement('img');
            img.src = image.image_url;
            img.alt = `Image ${index + 1}`;
            img.loading = 'lazy';
            
            // Create info container
            const infoContainer = document.createElement('div');
            infoContainer.className = 'info-container';
            
            // Create info items - put date and time at the top
            const infoItems = [
                { label: 'Date', value: image.date || 'N/A', className: 'date-time-info' },
                { label: 'Time', value: image.time || 'N/A', className: 'date-time-info' },
                { label: 'Name', value: image.customer_name || 'N/A' },
                { label: 'Check #', value: image.check_number || 'N/A' },
                { label: 'Amount', value: image.amount || 'N/A' },
                { label: 'Payment', value: image.payment_type || 'N/A' }
            ];
            
            infoItems.forEach(item => {
                const infoItem = document.createElement('div');
                infoItem.className = item.className ? `info-item ${item.className}` : 'info-item';
                infoItem.innerHTML = `<span class="info-label">${item.label}:</span> <span class="info-value">${item.value}</span>`;
                infoContainer.appendChild(infoItem);
            });
            
            // Add click event to open slideshow
            gridItem.addEventListener('click', () => {
                this.openSlideshow(index);
            });
            
            // Append elements
            imageContainer.appendChild(img);
            gridItem.appendChild(imageContainer);
            gridItem.appendChild(infoContainer);
            this.gridContainer.appendChild(gridItem);
        });
    }
    
    /**
     * Handle filter button click
     */
    handleFilter() {
        const field = this.filterField.value;
        const value = this.filterValue.value.toLowerCase();
        const sortOrder = this.filterSortOrder.value;
        
        if (!value) {
            // If no filter value, show all images sorted by the selected field
            this.filteredImages = [...this.images];
        } else {
            // Filter images by the selected field and value
            this.filteredImages = this.images.filter(image => {
                const fieldValue = String(image[field] || '').toLowerCase();
                return fieldValue.includes(value);
            });
        }
        
        // Sort the filtered images
        this.filteredImages.sort((a, b) => {
            let valueA = a[field] || '';
            let valueB = b[field] || '';
            
            // Handle different field types for proper sorting
            if (field === 'amount') {
                // Parse amount as number, removing currency symbols and non-numeric characters
                valueA = parseFloat(String(valueA).replace(/[^\d.-]/g, '') || 0);
                valueB = parseFloat(String(valueB).replace(/[^\d.-]/g, '') || 0);
            } else if (field === 'time') {
                // Convert time to comparable format (24-hour) with date for cross-day sorting
                valueA = this.convertTimeToSortableFormat(String(valueA), a.date);
                valueB = this.convertTimeToSortableFormat(String(valueB), b.date);
            } else if (field === 'date') {
                // Convert date to sortable format (YYYY-MM-DD)
                valueA = this.convertDateToSortableFormat(String(valueA));
                valueB = this.convertDateToSortableFormat(String(valueB));
            } else {
                // Convert to lowercase for string comparison
                valueA = String(valueA).toLowerCase();
                valueB = String(valueB).toLowerCase();
            }
            
            // Compare values
            if (valueA < valueB) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });
        
        // Render the filtered grid
        this.renderGrid();
    }
    
    /**
     * Handle clear filter button click
     */
    handleClearFilter() {
        // Clear filter value
        this.filterValue.value = '';
        
        // Get the current filter field and sort order
        const field = this.filterField.value;
        const sortOrder = this.filterSortOrder.value;
        
        // Reset filtered images
        this.filteredImages = [...this.images];
        
        // Sort the images by the current filter field and sort order
        this.filteredImages.sort((a, b) => {
            let valueA = a[field] || '';
            let valueB = b[field] || '';
            
            // Handle different field types for proper sorting
            if (field === 'amount') {
                // Parse amount as number, removing currency symbols and non-numeric characters
                valueA = parseFloat(String(valueA).replace(/[^\d.-]/g, '') || 0);
                valueB = parseFloat(String(valueB).replace(/[^\d.-]/g, '') || 0);
            } else if (field === 'time') {
                // Convert time to comparable format (24-hour) with date for cross-day sorting
                valueA = this.convertTimeToSortableFormat(String(valueA), a.date);
                valueB = this.convertTimeToSortableFormat(String(valueB), b.date);
            } else if (field === 'date') {
                // Convert date to sortable format (YYYY-MM-DD)
                valueA = this.convertDateToSortableFormat(String(valueA));
                valueB = this.convertDateToSortableFormat(String(valueB));
            } else {
                // Convert to lowercase for string comparison
                valueA = String(valueA).toLowerCase();
                valueB = String(valueB).toLowerCase();
            }
            
            // Compare values
            if (valueA < valueB) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });
        
        // Render the grid
        this.renderGrid();
    }
    
    /**
     * Handle slideshow view button click
     */
    handleSlideshowView() {
        // Open slideshow with the first image
        if (this.filteredImages.length > 0) {
            this.openSlideshow(0);
        }
    }
    
    /**
     * Open slideshow with the specified image index
     * @param {number} index - Index of the image to show
     */
    openSlideshow(index) {
        // Get the slideshow element
        const slideshowElement = document.getElementById('slideshowViewNoTip');
        
        // If slideshow element exists, show it
        if (slideshowElement) {
            // Create slideshow instance if it doesn't exist
            if (!slideshowElement.__slideshow) {
                slideshowElement.__slideshow = new Slideshow({
                    slideshowId: 'slideshowViewNoTip',
                    imageContainerId: 'slideshowImageContainerNoTip',
                    prevBtnId: 'prevSlideBtnNoTip',
                    nextBtnId: 'nextSlideBtnNoTip',
                    counterContainerId: 'slideCounterNoTip',
                    closeBtnClass: 'slideshow-close'
                });
            }
            
            // Store the component reference on the grid element for access from slideshow
            const gridElement = document.getElementById('organizedGridNoTip');
            if (gridElement) {
                gridElement.__component = this;
            }
            
            // Get the current filter field and sort order
            const field = this.filterField ? this.filterField.value : 'customer_name';
            const sortOrder = this.filterSortOrder ? this.filterSortOrder.value : 'asc';
            
            // Make a copy of the filtered images to avoid modifying the original array
            let sortedFilteredImages = [...this.filteredImages];
            let sortedAllImages = [...this.images];
            
            // Sort the images by the current filter field and sort order
            if (sortedFilteredImages.length > 0) {
                sortedFilteredImages.sort((a, b) => {
                    let valueA = a[field] || '';
                    let valueB = b[field] || '';
                    
                    // Handle different field types for proper sorting
                    if (field === 'amount') {
                        // Parse amount as number, removing currency symbols and non-numeric characters
                        valueA = parseFloat(String(valueA).replace(/[^\d.-]/g, '') || 0);
                        valueB = parseFloat(String(valueB).replace(/[^\d.-]/g, '') || 0);
                    } else if (field === 'time') {
                        // Convert time to comparable format (24-hour) with date for cross-day sorting
                        valueA = this.convertTimeToSortableFormat(String(valueA), a.date);
                        valueB = this.convertTimeToSortableFormat(String(valueB), b.date);
                    } else if (field === 'date') {
                        // Convert date to sortable format (YYYY-MM-DD)
                        valueA = this.convertDateToSortableFormat(String(valueA));
                        valueB = this.convertDateToSortableFormat(String(valueB));
                    } else {
                        // Convert to lowercase for string comparison
                        valueA = String(valueA).toLowerCase();
                        valueB = String(valueB).toLowerCase();
                    }
                    
                    // Compare values
                    if (valueA < valueB) {
                        return sortOrder === 'asc' ? -1 : 1;
                    }
                    if (valueA > valueB) {
                        return sortOrder === 'asc' ? 1 : -1;
                    }
                    return 0;
                });
            }
            
            // Sort all images the same way
            if (sortedAllImages.length > 0) {
                sortedAllImages.sort((a, b) => {
                    let valueA = a[field] || '';
                    let valueB = b[field] || '';
                    
                    // Handle different field types for proper sorting
                    if (field === 'amount') {
                        // Parse amount as number, removing currency symbols and non-numeric characters
                        valueA = parseFloat(String(valueA).replace(/[^\d.-]/g, '') || 0);
                        valueB = parseFloat(String(valueB).replace(/[^\d.-]/g, '') || 0);
                    } else if (field === 'time') {
                        // Convert time to comparable format (24-hour) with date for cross-day sorting
                        valueA = this.convertTimeToSortableFormat(String(valueA), a.date);
                        valueB = this.convertTimeToSortableFormat(String(valueB), b.date);
                    } else if (field === 'date') {
                        // Convert date to sortable format (YYYY-MM-DD)
                        valueA = this.convertDateToSortableFormat(String(valueA));
                        valueB = this.convertDateToSortableFormat(String(valueB));
                    } else {
                        // Convert to lowercase for string comparison
                        valueA = String(valueA).toLowerCase();
                        valueB = String(valueB).toLowerCase();
                    }
                    
                    // Compare values
                    if (valueA < valueB) {
                        return sortOrder === 'asc' ? -1 : 1;
                    }
                    if (valueA > valueB) {
                        return sortOrder === 'asc' ? 1 : -1;
                    }
                    return 0;
                });
            }
            
            // Find the index of the current image in the sorted array
            let sortedIndex = index;
            if (index >= 0 && index < this.filteredImages.length) {
                const currentImage = this.filteredImages[index];
                sortedIndex = sortedFilteredImages.findIndex(img => 
                    img.image_url === currentImage.image_url && 
                    img.customer_name === currentImage.customer_name
                );
                if (sortedIndex === -1) sortedIndex = 0;
            }
            
            // Use the openSlideshow method with both sorted filtered and all images
            slideshowElement.__slideshow.openSlideshow(sortedFilteredImages, sortedIndex, sortedAllImages);
        }
    }
    
    /**
     * Get the current filtered images (for slideshow toggle)
     * @returns {Array} - Array of filtered image objects
     */
    getCurrentImages() {
        return this.filteredImages;
    }
    
    /**
     * Handle export PDF button click
     */
    handleExportPdf() {
        // Import the generateImagesPdf function from the export service
        import('../services/exportService.js').then(module => {
            const { generateImagesPdf } = module;
            
            // Determine which images to export (filtered or all)
            const imagesToExport = this.filteredImages.length > 0 ? 
                this.filteredImages : this.images;
            
            if (imagesToExport.length === 0) {
                console.error('No images to export');
                alert('No images to export. Please process some images first.');
                return;
            }
            
            // Generate PDF with the images using portrait orientation for better image display
            generateImagesPdf(imagesToExport, 'organized-images-without-tip.pdf', {
                orientation: 'portrait',
                format: 'a4',
                imageQuality: 0.9
            });
        }).catch(error => {
            console.error('Error importing export service:', error);
            alert('Failed to generate PDF. Please try again.');
        });
    }
}
