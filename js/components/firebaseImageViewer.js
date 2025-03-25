/**
 * Firebase Image Viewer Component
 * Displays images stored in Firebase Storage for the current user
 */
import { getUserImages, getRestaurantImages } from '../services/firebaseStorageService.js';
import { auth } from '../firebase-config.js';

// Detect if running on localhost
const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
import { showNotification } from '../utils/uiUtils.js';

export class FirebaseImageViewer {
    /**
     * Create a new FirebaseImageViewer instance
     * @param {HTMLElement} container - The container element
     * @param {Object} options - Configuration options
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.images = [];
        this.isLoading = false;
        this.filters = {
            restaurant: null,
            dateRange: null
        };
        
        // Initialize the component
        this.init();
    }
    
    /**
     * Initialize the component
     */
    async init() {
        // Check if user is authenticated
        if (!auth.currentUser) {
            console.error('❌ [Image Viewer] User not authenticated');
            this.renderAuthRequired();
            return;
        }
        
        // Create component structure
        this.container.innerHTML = '';
        this.container.className = 'firebase-image-viewer';
        
        // Create header with title and refresh button
        const header = document.createElement('div');
        header.className = 'image-viewer-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Your Uploaded Receipt Images';
        
        const refreshButton = document.createElement('button');
        refreshButton.className = 'refresh-button';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshButton.title = 'Refresh images';
        refreshButton.addEventListener('click', () => this.loadImages());
        
        header.appendChild(title);
        header.appendChild(refreshButton);
        this.container.appendChild(header);
        
        // Create filter controls
        this.createFilterControls();
        
        // Create image grid container
        const imageGrid = document.createElement('div');
        imageGrid.className = 'image-grid';
        this.imageGrid = imageGrid;
        this.container.appendChild(imageGrid);
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading images...';
        this.loadingIndicator = loadingIndicator;
        this.container.appendChild(loadingIndicator);
        
        // Load images
        await this.loadImages();
    }
    
    /**
     * Create filter controls
     */
    createFilterControls() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'image-filter-controls';
        
        // Restaurant filter
        const restaurantFilter = document.createElement('div');
        restaurantFilter.className = 'filter-control';
        
        const restaurantLabel = document.createElement('label');
        restaurantLabel.textContent = 'Restaurant/Bar:';
        restaurantLabel.htmlFor = 'restaurant-filter';
        
        const restaurantSelect = document.createElement('select');
        restaurantSelect.id = 'restaurant-filter';
        restaurantSelect.addEventListener('change', (e) => {
            this.filters.restaurant = e.target.value === 'all' ? null : e.target.value;
            this.filterImages();
        });
        
        // Add "All" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Restaurants';
        restaurantSelect.appendChild(allOption);
        
        // Will be populated with restaurants when images are loaded
        this.restaurantSelect = restaurantSelect;
        
        restaurantFilter.appendChild(restaurantLabel);
        restaurantFilter.appendChild(restaurantSelect);
        
        // Date range filter
        const dateFilter = document.createElement('div');
        dateFilter.className = 'filter-control';
        
        const dateLabel = document.createElement('label');
        dateLabel.textContent = 'Date Range:';
        dateLabel.htmlFor = 'date-filter';
        
        const dateSelect = document.createElement('select');
        dateSelect.id = 'date-filter';
        dateSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            
            if (value === 'all') {
                this.filters.dateRange = null;
            } else if (value === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                this.filters.dateRange = { from: today };
            } else if (value === 'this-week') {
                const today = new Date();
                const firstDay = new Date(today);
                firstDay.setDate(today.getDate() - today.getDay());
                firstDay.setHours(0, 0, 0, 0);
                this.filters.dateRange = { from: firstDay };
            } else if (value === 'this-month') {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                this.filters.dateRange = { from: firstDay };
            } else if (value === 'custom') {
                // For a real implementation, could use a date picker
                // For now, just use last 30 days as "custom"
                const today = new Date();
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                this.filters.dateRange = { from: thirtyDaysAgo };
            }
            
            this.filterImages();
        });
        
        // Add date range options
        const dateOptions = [
            { value: 'all', text: 'All Time' },
            { value: 'today', text: 'Today' },
            { value: 'this-week', text: 'This Week' },
            { value: 'this-month', text: 'This Month' },
            { value: 'custom', text: 'Custom Range' }
        ];
        
        dateOptions.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.text;
            dateSelect.appendChild(optionEl);
        });
        
        dateFilter.appendChild(dateLabel);
        dateFilter.appendChild(dateSelect);
        
        // Assemble filter container
        filterContainer.appendChild(restaurantFilter);
        filterContainer.appendChild(dateFilter);
        
        this.container.appendChild(filterContainer);
    }
    
    /**
     * Render auth required message
     */
    renderAuthRequired() {
        this.container.innerHTML = '';
        
        const authRequired = document.createElement('div');
        authRequired.className = 'auth-required';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-lock';
        
        const message = document.createElement('p');
        message.textContent = 'Please log in to view your uploaded images.';
        
        const loginButton = document.createElement('button');
        loginButton.textContent = 'Log In';
        loginButton.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
        
        authRequired.appendChild(icon);
        authRequired.appendChild(message);
        authRequired.appendChild(loginButton);
        
        this.container.appendChild(authRequired);
    }
    
    /**
     * Load images from Firebase Storage
     */
    async loadImages() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.loadingIndicator.style.display = 'flex';
        this.imageGrid.innerHTML = '';
        
        try {
            // Load all images for the current user
            const images = await getUserImages();
            console.log(`✅ [Image Viewer] Loaded ${images.length} images`);
            
            this.images = images;
            
            // Update restaurant filter with unique restaurants
            this.updateRestaurantFilter();
            
            // Display images
            this.displayImages(images);
        } catch (error) {
            console.error('❌ [Image Viewer] Error loading images:', error);
            showNotification('Error loading images: ' + error.message, 'error');
            
            this.imageGrid.innerHTML = '<div class="error-message">Error loading images</div>';
        } finally {
            this.isLoading = false;
            this.loadingIndicator.style.display = 'none';
        }
    }
    
    /**
     * Update restaurant filter with unique restaurants from loaded images
     */
    updateRestaurantFilter() {
        // Clear existing options except the "All" option
        while (this.restaurantSelect.options.length > 1) {
            this.restaurantSelect.options.remove(1);
        }
        
        // Get unique restaurant IDs
        const restaurants = new Map();
        
        this.images.forEach(image => {
            if (image.metadata && image.metadata.restaurantId) {
                const { restaurantId } = image.metadata;
                
                // Try to get restaurant name from localStorage
                let restaurantName = 'Unknown Restaurant';
                try {
                    const bars = JSON.parse(localStorage.getItem('bars') || '[]');
                    const bar = bars.find(b => b.id === restaurantId || b.barId === restaurantId);
                    if (bar) {
                        restaurantName = bar.name || bar.barName || restaurantName;
                    }
                } catch (error) {
                    console.error('Error parsing bars from localStorage:', error);
                }
                
                restaurants.set(restaurantId, restaurantName);
            }
        });
        
        // Add options for each restaurant
        restaurants.forEach((name, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            this.restaurantSelect.appendChild(option);
        });
    }
    
    /**
     * Display images in the grid
     * @param {Array} images - Array of image metadata
     */
    displayImages(images) {
        this.imageGrid.innerHTML = '';
        
        if (images.length === 0) {
            this.imageGrid.innerHTML = '<div class="no-images">No images found</div>';
            return;
        }
        
        images.forEach(image => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            
            // Image thumbnail
            const thumbnail = document.createElement('img');
            thumbnail.src = image.downloadURL;
            thumbnail.alt = image.name;
            thumbnail.loading = 'lazy';
            
            // Click to view full size
            thumbnail.addEventListener('click', () => {
                this.showImageModal(image);
            });
            
            // Image info
            const imageInfo = document.createElement('div');
            imageInfo.className = 'image-info';
            
            // Extract filename without timestamp
            let displayName = image.name;
            if (displayName.includes('_')) {
                displayName = displayName.substring(displayName.indexOf('_') + 1);
            }
            
            // Truncate if too long
            if (displayName.length > 20) {
                displayName = displayName.substring(0, 17) + '...';
            }
            
            // Image name
            const imageName = document.createElement('div');
            imageName.className = 'image-name';
            imageName.textContent = displayName;
            imageName.title = image.name;
            
            // Image date
            const imageDate = document.createElement('div');
            imageDate.className = 'image-date';
            
            // Try to get upload timestamp from filename or metadata
            let uploadDate = new Date();
            if (image.uploadTimestamp) {
                uploadDate = new Date(parseInt(image.uploadTimestamp));
            } else if (image.name.includes('_')) {
                const timestampStr = image.name.split('_')[0];
                if (!isNaN(parseInt(timestampStr))) {
                    uploadDate = new Date(parseInt(timestampStr));
                }
            }
            
            imageDate.textContent = uploadDate.toLocaleDateString();
            
            // Restaurant info if available
            if (image.metadata && image.metadata.restaurantId) {
                const restaurantInfo = document.createElement('div');
                restaurantInfo.className = 'restaurant-info';
                
                // Try to get restaurant name
                let restaurantName = 'Unknown Restaurant';
                try {
                    const bars = JSON.parse(localStorage.getItem('bars') || '[]');
                    const bar = bars.find(b => b.id === image.metadata.restaurantId || b.barId === image.metadata.restaurantId);
                    if (bar) {
                        restaurantName = bar.name || bar.barName || restaurantName;
                    }
                } catch (error) {
                    console.error('Error parsing bars from localStorage:', error);
                }
                
                restaurantInfo.textContent = restaurantName;
                imageInfo.appendChild(restaurantInfo);
            }
            
            // Assemble image info
            imageInfo.appendChild(imageName);
            imageInfo.appendChild(imageDate);
            
            // Assemble card
            imageCard.appendChild(thumbnail);
            imageCard.appendChild(imageInfo);
            
            this.imageGrid.appendChild(imageCard);
        });
    }
    
    /**
     * Show image modal with full-size image
     * @param {Object} image - The image metadata
     */
    showImageModal(image) {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Full-size image
        const fullImage = document.createElement('img');
        fullImage.src = image.downloadURL;
        fullImage.alt = image.name;
        
        // Image details
        const imageDetails = document.createElement('div');
        imageDetails.className = 'image-details';
        
        // File name
        const fileName = document.createElement('div');
        fileName.className = 'detail-item';
        fileName.innerHTML = `<strong>File:</strong> ${image.name}`;
        
        // Upload date
        let uploadDate = new Date();
        if (image.uploadTimestamp) {
            uploadDate = new Date(parseInt(image.uploadTimestamp));
        } else if (image.name.includes('_')) {
            const timestampStr = image.name.split('_')[0];
            if (!isNaN(parseInt(timestampStr))) {
                uploadDate = new Date(parseInt(timestampStr));
            }
        }
        
        const dateInfo = document.createElement('div');
        dateInfo.className = 'detail-item';
        dateInfo.innerHTML = `<strong>Uploaded:</strong> ${uploadDate.toLocaleString()}`;
        
        // Restaurant info if available
        let restaurantInfo = null;
        if (image.metadata && image.metadata.restaurantId) {
            restaurantInfo = document.createElement('div');
            restaurantInfo.className = 'detail-item';
            
            // Try to get restaurant name
            let restaurantName = 'Unknown Restaurant';
            try {
                const bars = JSON.parse(localStorage.getItem('bars') || '[]');
                const bar = bars.find(b => b.id === image.metadata.restaurantId || b.barId === image.metadata.restaurantId);
                if (bar) {
                    restaurantName = bar.name || bar.barName || restaurantName;
                }
            } catch (error) {
                console.error('Error parsing bars from localStorage:', error);
            }
            
            restaurantInfo.innerHTML = `<strong>Restaurant/Bar:</strong> ${restaurantName}`;
        }
        
        // Download link
        const downloadLink = document.createElement('a');
        downloadLink.className = 'download-link';
        downloadLink.href = image.downloadURL;
        downloadLink.download = image.name;
        downloadLink.textContent = 'Download Image';
        
        // Assemble details
        imageDetails.appendChild(fileName);
        imageDetails.appendChild(dateInfo);
        if (restaurantInfo) imageDetails.appendChild(restaurantInfo);
        imageDetails.appendChild(downloadLink);
        
        // Assemble modal
        modalContent.appendChild(closeButton);
        modalContent.appendChild(fullImage);
        modalContent.appendChild(imageDetails);
        
        modal.appendChild(modalContent);
        
        // Add to document
        document.body.appendChild(modal);
        
        // Close on click outside content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    /**
     * Filter images based on current filters
     */
    filterImages() {
        // Apply filters
        const filteredImages = this.images.filter(image => {
            // Restaurant filter
            if (this.filters.restaurant && (!image.metadata || image.metadata.restaurantId !== this.filters.restaurant)) {
                return false;
            }
            
            // Date range filter
            if (this.filters.dateRange) {
                // Get image timestamp
                let timestamp;
                if (image.uploadTimestamp) {
                    timestamp = parseInt(image.uploadTimestamp);
                } else if (image.name.includes('_')) {
                    const timestampStr = image.name.split('_')[0];
                    if (!isNaN(parseInt(timestampStr))) {
                        timestamp = parseInt(timestampStr);
                    }
                }
                
                if (timestamp) {
                    const imageDate = new Date(timestamp);
                    
                    // Check if image date is within range
                    if (this.filters.dateRange.from && imageDate < this.filters.dateRange.from) {
                        return false;
                    }
                    
                    if (this.filters.dateRange.to && imageDate > this.filters.dateRange.to) {
                        return false;
                    }
                }
            }
            
            return true;
        });
        
        // Display filtered images
        this.displayImages(filteredImages);
    }
}

// Add CSS
const style = document.createElement('style');
style.textContent = `
.firebase-image-viewer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.refresh-button {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #4a4a4a;
    font-size: 1rem;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 0.2s, color 0.2s;
}

.refresh-button:hover {
    background-color: #f0f0f0;
    color: #000;
}

.image-filter-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.filter-control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-control label {
    font-weight: bold;
    color: #4a4a4a;
}

.filter-control select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    background-color: #fff;
}

.image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.image-card {
    display: flex;
    flex-direction: column;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    background-color: #fff;
    transition: transform 0.2s, box-shadow 0.2s;
}

.image-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.image-card img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    cursor: pointer;
}

.image-info {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.image-name {
    font-weight: bold;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.image-date, .restaurant-info {
    font-size: 0.8rem;
    color: #666;
}

.loading-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    color: #666;
}

.no-images {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
    font-style: italic;
}

.error-message {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #e74c3c;
}

.auth-required {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
    text-align: center;
}

.auth-required i {
    font-size: 2rem;
    color: #666;
}

.auth-required p {
    color: #4a4a4a;
    margin-bottom: 1rem;
}

.auth-required button {
    padding: 0.5rem 2rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

.image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 1rem;
    border-radius: 8px;
    max-width: 90%;
    max-height: 90%;
    overflow: auto;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 1.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #666;
    z-index: 10;
}

.modal-content img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
}

.image-details {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-top: 1px solid #eee;
}

.detail-item {
    font-size: 0.9rem;
    color: #333;
}

.download-link {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    text-align: center;
}
`;
document.head.appendChild(style);
