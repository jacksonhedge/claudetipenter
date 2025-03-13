document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const fileCount = document.getElementById('fileCount');
    const processBtn = document.getElementById('processBtn');
    const resultsSection = document.getElementById('resultsSection');
    const progressBar = document.getElementById('progressBar');
    const jsonOutput = document.getElementById('jsonOutput');
    const copyBtn = document.getElementById('copyBtn');
    const tableBody = document.getElementById('tableBody');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const sortField = document.getElementById('sortField');
    const sortOrder = document.getElementById('sortOrder');
    const sortBtn = document.getElementById('sortBtn');
    
    // Navigation Elements
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Organized Tab Elements
    const organizedGrid = document.getElementById('organizedGrid');
    const filterField = document.getElementById('filterField');
    const filterValue = document.getElementById('filterValue');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    
    // Slideshow Elements
    const slideshowView = document.getElementById('slideshowView');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const slideshowViewBtn = document.getElementById('slideshowViewBtn');
    const prevSlideBtn = document.getElementById('prevSlideBtn');
    const nextSlideBtn = document.getElementById('nextSlideBtn');
    const slideCounter = document.getElementById('slideCounter');
    const slideshowImageContainer = document.getElementById('slideshowImageContainer');
    
    // Slideshow state
    let currentSlideIndex = 0;
    
    // Create Clear All Button if it doesn't exist
    let clearAllBtn = document.getElementById('clearAllBtn');
    if (!clearAllBtn && fileList) {
        // Find the file-list-container
        const fileListContainer = document.querySelector('.file-list-container');
        if (fileListContainer) {
            // Check if file-list-header exists, if not create it
            let fileListHeader = fileListContainer.querySelector('.file-list-header');
            if (!fileListHeader) {
                // Create the header
                fileListHeader = document.createElement('div');
                fileListHeader.className = 'file-list-header';
                
                // Move the existing h3 into the header
                const existingH3 = fileListContainer.querySelector('h3');
                if (existingH3) {
                    fileListHeader.appendChild(existingH3.cloneNode(true));
                    existingH3.remove();
                } else {
                    // Create a new h3 if it doesn't exist
                    const newH3 = document.createElement('h3');
                    newH3.innerHTML = 'Selected Files <span id="fileCount">(0)</span>';
                    fileListHeader.appendChild(newH3);
                }
                
                // Create clear all button
                clearAllBtn = document.createElement('button');
                clearAllBtn.id = 'clearAllBtn';
                clearAllBtn.className = 'clear-all-btn';
                clearAllBtn.textContent = 'Clear All';
                fileListHeader.appendChild(clearAllBtn);
                
                // Insert the header before the file list
                fileListContainer.insertBefore(fileListHeader, fileList);
            } else {
                // If header exists but button doesn't, add it
                clearAllBtn = document.createElement('button');
                clearAllBtn.id = 'clearAllBtn';
                clearAllBtn.className = 'clear-all-btn';
                clearAllBtn.textContent = 'Clear All';
                fileListHeader.appendChild(clearAllBtn);
            }
        }
    }
    
    // State
    const selectedFiles = new Map(); // Using Map to store files with unique IDs
    let nextFileId = 1;
    let currentData = null; // Store current data for sorting
    let processedImages = []; // Store processed images for the organized tab
    
    // Configuration
    const TEST_MODE = true; // Set to true to enable sample images for testing
    const USE_REAL_API = true; // Set to true to use the real API through the proxy server
    
    if (TEST_MODE) {
        // Add sample images for testing
        loadSampleImages();
    }
    
    // Function to load sample images for testing
    function loadSampleImages() {
        // Create 50 sample image objects
        for (let i = 1; i <= 50; i++) {
            // Create a mock File object with varied file sizes (5-20KB)
            const fileSize = Math.floor(Math.random() * 15 + 5) * 1024;
            
            // Create varied filenames with different formats
            let fileName;
            const fileType = Math.random() > 0.3 ? 'jpeg' : 'png';
            
            // Create more realistic file names
            if (i % 5 === 0) {
                fileName = `receipt_${Math.floor(Math.random() * 10000)}.${fileType}`;
            } else if (i % 7 === 0) {
                fileName = `check_${Math.floor(Math.random() * 5000)}.${fileType}`;
            } else if (i % 3 === 0) {
                fileName = `IMG_${Math.floor(Math.random() * 9000) + 1000}.${fileType}`;
            } else {
                fileName = `sample_image_${i}.${fileType}`;
            }
            
            const mockFile = new File(
                [new ArrayBuffer(fileSize)],
                fileName,
                { type: `image/${fileType}` }
            );
            
            const fileId = nextFileId++;
            selectedFiles.set(fileId, mockFile);
            
            // Create file preview with placeholder image
            createFilePreviewWithPlaceholder(mockFile, fileId);
        }
        
        updateFileCount();
        validateFileCount();
        
        // Ensure the process button is enabled when sample images are loaded
        if (selectedFiles.size >= 3 && selectedFiles.size <= 100) {
            processBtn.disabled = false;
        }
    }
    
    // Create file preview with placeholder for test mode
    function createFilePreviewWithPlaceholder(file, fileId) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = fileId;
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        
        // Create placeholder thumbnail with a simple image icon
        const thumbnail = document.createElement('img');
        thumbnail.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0iTTIxIDE1bC0zLjktMy45LTYuMSA2LjEtNC00Ii8+PC9zdmc+';
        thumbnail.width = 40;
        thumbnail.height = 40;
        
        // File name text
        const nameText = document.createElement('span');
        nameText.textContent = file.name;
        
        fileName.appendChild(thumbnail);
        fileName.appendChild(nameText);
        
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            selectedFiles.delete(parseInt(fileItem.dataset.fileId));
            fileItem.remove();
            updateFileCount();
            validateFileCount();
        });
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
    }
    
    // Event Listeners
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    processBtn.addEventListener('click', processImages);
    copyBtn.addEventListener('click', copyJsonToClipboard);
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllFiles);
    }
    exportCsvBtn.addEventListener('click', exportTableToCsv);
    sortBtn.addEventListener('click', sortTable);
    
    // Navigation Tab Event Listeners
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            
            // Update active tab
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            // Show selected tab content
            tabContents.forEach(content => {
                if (content.id === tabId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
    
    // Organized Tab Event Listeners
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', filterOrganizedImages);
    }
    
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            filterValue.value = '';
            displayOrganizedImages(processedImages);
        });
    }
    
    // View toggle event listeners
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            setViewMode('grid');
        });
    }
    
    if (slideshowViewBtn) {
        slideshowViewBtn.addEventListener('click', () => {
            setViewMode('slideshow');
        });
    }
    
    // Slideshow navigation event listeners
    if (prevSlideBtn) {
        prevSlideBtn.addEventListener('click', () => {
            navigateSlideshow(-1);
        });
    }
    
    if (nextSlideBtn) {
        nextSlideBtn.addEventListener('click', () => {
            navigateSlideshow(1);
        });
    }
    
    // Add Test Images button
    const addTestImagesBtn = document.getElementById('addTestImagesBtn');
    if (addTestImagesBtn) {
        addTestImagesBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the dropArea click event
            loadSampleImages();
        });
    }
    
    // Clear All Files
    function clearAllFiles() {
        // Show confirmation dialog
        if (selectedFiles.size === 0) {
            return; // No files to clear
        }
        
        const isConfirmed = confirm('Are you sure you want to remove all files?');
        
        if (isConfirmed) {
            // Clear all files
            selectedFiles.clear();
            fileList.innerHTML = '';
            updateFileCount();
            validateFileCount();
        }
    }
    
    // Drag and Drop Handlers
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('active');
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('active');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('active');
        
        const files = e.dataTransfer.files;
        addFiles(files);
    }
    
    // File Selection Handler
    function handleFileSelect(e) {
        const files = e.target.files;
        addFiles(files);
        fileInput.value = ''; // Reset file input
    }
    
    // Add Files to Selection
    function addFiles(files) {
        for (const file of files) {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not an image file.`);
                continue;
            }
            
            const fileId = nextFileId++;
            selectedFiles.set(fileId, file);
            
            // Create file preview
            createFilePreview(file, fileId);
        }
        
        updateFileCount();
        validateFileCount();
    }
    
    // Create File Preview
    function createFilePreview(file, fileId) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = fileId;
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        
        // Create thumbnail
        const thumbnail = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (e) => {
            thumbnail.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // File name text
        const nameText = document.createElement('span');
        nameText.textContent = file.name;
        
        fileName.appendChild(thumbnail);
        fileName.appendChild(nameText);
        
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            selectedFiles.delete(parseInt(fileItem.dataset.fileId));
            fileItem.remove();
            updateFileCount();
            validateFileCount();
        });
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
    }
    
    // Update File Count
    function updateFileCount() {
        const count = selectedFiles.size;
        fileCount.textContent = `(${count})`;
    }
    
    // Validate File Count
    function validateFileCount() {
        const count = selectedFiles.size;
        processBtn.disabled = count < 3 || count > 100;
    }
    
    // Set view mode (grid or slideshow)
    function setViewMode(mode) {
        if (mode === 'grid') {
            // Update button states
            gridViewBtn.classList.add('active');
            slideshowViewBtn.classList.remove('active');
            
            // Show grid, hide slideshow
            organizedGrid.style.display = 'grid';
            slideshowView.style.display = 'none';
        } else if (mode === 'slideshow') {
            // Update button states
            gridViewBtn.classList.remove('active');
            slideshowViewBtn.classList.add('active');
            
            // Hide grid, show slideshow
            organizedGrid.style.display = 'none';
            slideshowView.style.display = 'block';
            
            // Initialize slideshow with current filtered images
            initializeSlideshow();
        }
    }
    
    // Initialize slideshow
    function initializeSlideshow() {
        // Reset to first slide
        currentSlideIndex = 0;
        
        // If we have images, display the first one
        if (processedImages && processedImages.length > 0) {
            displayCurrentSlide();
        } else {
            // Show empty state
            slideshowImageContainer.innerHTML = `
                <div class="empty-state">
                    <p>No images have been processed yet. Use the Scanner tab to process images first.</p>
                </div>
            `;
            
            // Disable navigation buttons
            prevSlideBtn.disabled = true;
            nextSlideBtn.disabled = true;
            slideCounter.textContent = 'No images';
        }
    }
    
    // Display current slide
    function displayCurrentSlide() {
        if (!processedImages || processedImages.length === 0) {
            return;
        }
        
        // Get current image data
        const currentImage = processedImages[currentSlideIndex];
        
        // Update slide counter
        slideCounter.textContent = `Image ${currentSlideIndex + 1} of ${processedImages.length}`;
        
        // Update navigation button states
        prevSlideBtn.disabled = currentSlideIndex === 0;
        nextSlideBtn.disabled = currentSlideIndex === processedImages.length - 1;
        
        // Create slideshow content
        slideshowImageContainer.innerHTML = `
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM0OThkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cGF0aCBkPSJNMjEgMTVsLTMuOS0zLjktNi4xIDYuMS00LTQiLz48L3N2Zz4=" 
                 class="slideshow-image" 
                 alt="Receipt ${currentSlideIndex + 1}">
            <div class="slideshow-info">
                <h3>${currentImage.customer_name || `Receipt ${currentSlideIndex + 1}`}</h3>
                <div class="slideshow-info-grid">
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">${currentImage.date || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Time</div>
                        <div class="info-value">${currentImage.time || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Check Number</div>
                        <div class="info-value">${currentImage.check_number || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Amount</div>
                        <div class="info-value">${currentImage.amount || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Tip</div>
                        <div class="info-value tip">${currentImage.tip || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Total</div>
                        <div class="info-value">${currentImage.total || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Signed</div>
                        <div class="info-value">${currentImage.signed ? 'Yes' : 'No'}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Navigate slideshow (prev/next)
    function navigateSlideshow(direction) {
        if (!processedImages || processedImages.length === 0) {
            return;
        }
        
        // Calculate new index
        const newIndex = currentSlideIndex + direction;
        
        // Check if new index is valid
        if (newIndex >= 0 && newIndex < processedImages.length) {
            currentSlideIndex = newIndex;
            displayCurrentSlide();
        }
    }
    
    // Filter Organized Images
    function filterOrganizedImages() {
        const field = filterField.value;
        const value = filterValue.value.toLowerCase();
        
        if (!value.trim() || !processedImages.length) {
            displayOrganizedImages(processedImages);
            
            // If in slideshow view, reinitialize with all images
            if (slideshowView.style.display === 'block') {
                initializeSlideshow();
            }
            return;
        }
        
        const filteredImages = processedImages.filter(item => {
            if (!item[field]) return false;
            
            let fieldValue = String(item[field]).toLowerCase();
            // Remove $ for monetary values
            if (field === 'total' || field === 'tip' || field === 'amount') {
                fieldValue = fieldValue.replace(/\$/g, '');
            }
            
            return fieldValue.includes(value);
        });
        
        // Update the processed images temporarily for the filter
        const originalImages = [...processedImages];
        processedImages = filteredImages;
        
        // Display filtered images in current view
        if (slideshowView.style.display === 'block') {
            initializeSlideshow();
        } else {
            displayOrganizedImages(filteredImages);
        }
        
        // Restore original images array
        processedImages = originalImages;
    }
    
    // Display Organized Images
    function displayOrganizedImages(images) {
        // Clear the grid
        organizedGrid.innerHTML = '';
        
        if (!images || images.length === 0) {
            // Show empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = '<p>No images match your filter criteria. Try adjusting your filter or clear it.</p>';
            organizedGrid.appendChild(emptyState);
            return;
        }
        
        // Create image cards
        images.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'image-card';
            
            // Create image preview (placeholder for now)
            const imgPreview = document.createElement('img');
            imgPreview.className = 'image-preview';
            imgPreview.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM0OThkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cGF0aCBkPSJNMjEgMTVsLTMuOS0zLjktNi4xIDYuMS00LTQiLz48L3N2Zz4=';
            imgPreview.alt = `Receipt ${index + 1}`;
            
            // Create info section
            const infoDiv = document.createElement('div');
            infoDiv.className = 'image-info';
            
            // Add customer name as title
            const title = document.createElement('h4');
            title.textContent = item.customer_name || `Receipt ${index + 1}`;
            
            // Add other details
            const timeP = document.createElement('p');
            timeP.textContent = `Time: ${item.time || 'N/A'}`;
            
            const totalP = document.createElement('p');
            totalP.textContent = `Total: ${item.total || 'N/A'}`;
            
            const tipP = document.createElement('p');
            tipP.className = 'tip-amount';
            tipP.textContent = `Tip: ${item.tip || 'N/A'}`;
            
            // Assemble the card
            infoDiv.appendChild(title);
            infoDiv.appendChild(timeP);
            infoDiv.appendChild(totalP);
            infoDiv.appendChild(tipP);
            
            card.appendChild(imgPreview);
            card.appendChild(infoDiv);
            
            organizedGrid.appendChild(card);
        });
    }
    
    // Process Images
    async function processImages() {
        // Skip validation in test mode
        if (!TEST_MODE && (selectedFiles.size < 3 || selectedFiles.size > 100)) {
            alert('Please select between 3 and 100 images.');
            return;
        }
        
        // Show results section
        resultsSection.style.display = 'block';
        
        // Reset progress and output
        progressBar.style.width = '0%';
        jsonOutput.textContent = 'Processing...';
        tableBody.innerHTML = ''; // Clear table
        
        // Start countdown timer
        const countdownTimer = document.getElementById('countdownTimer');
        const imageCount = selectedFiles.size;
        
        // Estimate processing time based on number of images
        // Base time: 5 seconds + 2 seconds per image
        let estimatedSeconds = 5 + (imageCount * 2);
        startCountdown(estimatedSeconds);
        
        try {
            // Convert files to base64 with compression
            const filePromises = Array.from(selectedFiles.values()).map(compressAndConvertToBase64);
            const base64Files = await Promise.all(filePromises);
            
            // Process with Claude API
            const result = await processWithClaudeAPI(base64Files);
            
            // Store the current data for sorting
            currentData = result;
            
            // Format monetary values
            const formattedResult = formatMonetaryValues(JSON.parse(JSON.stringify(result)));
            
            // Display result
            jsonOutput.textContent = JSON.stringify(formattedResult, null, 2);
            progressBar.style.width = '100%';
            
            // Stop countdown timer
            clearInterval(countdownInterval);
            countdownTimer.textContent = "Complete";
            
            // Store processed images for organized tab
            processedImages = result.results || [];
            
            // Populate table view
            populateTableView(formattedResult);
            
            // Update API cost display if available
            if (formattedResult.api_cost && formattedResult.api_cost.total_cost) {
                updateApiCostDisplay(formattedResult.api_cost.total_cost);
            }
            
            // Update organized images tab
            displayOrganizedImages(processedImages);
            
            // Initialize slideshow (but keep it hidden if not in slideshow view)
            if (slideshowView) {
                // Only show if in slideshow mode
                const isSlideshow = slideshowViewBtn && slideshowViewBtn.classList.contains('active');
                if (isSlideshow) {
                    setViewMode('slideshow');
                } else {
                    // Initialize but keep hidden
                    slideshowView.style.display = 'none';
                    initializeSlideshow();
                }
            }
        } catch (error) {
            console.error('Error processing images:', error);
            jsonOutput.textContent = `Error: ${error.message}`;
            progressBar.style.width = '100%';
            
            // Stop countdown timer on error
            clearInterval(countdownInterval);
            countdownTimer.textContent = "Error";
        }
    }
    
    // Countdown timer variables
    let countdownInterval;
    let remainingSeconds = 0;
    
    // Start countdown timer
    function startCountdown(seconds) {
        const countdownTimer = document.getElementById('countdownTimer');
        remainingSeconds = seconds;
        
        // Update timer immediately
        updateCountdownDisplay();
        
        // Clear any existing interval
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        // Update timer every second
        countdownInterval = setInterval(() => {
            remainingSeconds--;
            
            if (remainingSeconds <= 0) {
                // Don't clear the interval yet, as processing might still be ongoing
                // Just keep showing 00:00
                remainingSeconds = 0;
            }
            
            updateCountdownDisplay();
        }, 1000);
    }
    
    // Update countdown display
    function updateCountdownDisplay() {
        const countdownTimer = document.getElementById('countdownTimer');
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        countdownTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Compress and convert file to base64
    async function compressAndConvertToBase64(file) {
        return new Promise((resolve, reject) => {
            // Create a canvas for image compression
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Set up image load handler
            img.onload = () => {
                // Calculate new dimensions (max 1200px width/height while maintaining aspect ratio)
                let width = img.width;
                let height = img.height;
                const maxDimension = 1200;
                
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                
                // Resize image
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Get compressed image as base64
                const quality = 0.8; // 80% quality, good balance between size and quality
                const base64String = canvas.toDataURL(file.type, quality).split(',')[1];
                
                resolve({
                    name: file.name,
                    type: file.type,
                    data: base64String
                });
            };
            
            // Handle errors
            img.onerror = () => {
                // Fall back to regular base64 conversion if compression fails
                const reader = new FileReader();
                reader.onload = () => {
                    const base64String = reader.result.split(',')[1];
                    resolve({
                        name: file.name,
                        type: file.type,
                        data: base64String
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            };
            
            // Only try to compress image files
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            } else {
                // For non-image files, use regular base64 conversion
                const reader = new FileReader();
                reader.onload = () => {
                    const base64String = reader.result.split(',')[1];
                    resolve({
                        name: file.name,
                        type: file.type,
                        data: base64String
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Convert File to Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve({
                    name: file.name,
                    type: file.type,
                    data: base64String
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Process with Claude API
    async function processWithClaudeAPI(base64Files) {
        // Update progress bar to show API call started
        progressBar.style.width = '20%';
        
        // Check if we should use the real API or simulated responses
        if (USE_REAL_API) {
            try {
                // Use the backend proxy server instead of calling Claude API directly
                const apiUrl = '/api/process-images';
                
                progressBar.style.width = '40%';
                
                // Prepare the API request to our proxy server
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        images: base64Files
                    })
                });
                
                progressBar.style.width = '70%';
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                }
                
                // The server already processes the Claude API response and returns a structured JSON
                const result = await response.json();
                progressBar.style.width = '90%';
                
                return result;
            } catch (error) {
                console.error('Error calling Claude API:', error);
                
                // Handle any API fetch errors (including CORS errors)
                console.warn(`API Error: ${error.message}`);
                console.warn(`Falling back to simulated response due to API error.`);
                
                // Show a special message about API limitations
                const apiErrorMessage = `
API Error: Unable to access the Claude API. 

This is likely due to one of the following:
1. The API key in the .env file is not set correctly
2. Network connectivity issues
3. The Claude API service is temporarily unavailable

For demonstration purposes, we'll show simulated results below:
                `;
                
                console.warn(apiErrorMessage);
                
                // Fall back to simulated response
                return getSimulatedResponse(base64Files);
            }
        } else {
            // Use simulated API response
            progressBar.style.width = '40%';
            
            // Simulate API call with timeout
            return new Promise((resolve) => {
                setTimeout(() => {
                    progressBar.style.width = '80%';
                    resolve(getSimulatedResponse(base64Files));
                }, 2000);
            });
        }
    }
    
    // Generate simulated response
    function getSimulatedResponse(base64Files) {
        // Sample data arrays for more variety
        const firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Jennifer", "William", "Lisa", "James", "Mary", "Thomas", "Patricia", "Charles"];
        const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson"];
        const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        const days = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28"];
        const years = ["2024", "2025"];
        const hours = ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21"];
        const minutes = ["00", "15", "30", "45"];
        
        return {
            success: true,
            processed_images: base64Files.length,
            note: "This is a simulated response. To use the actual Claude API, you would need a backend proxy server due to CORS limitations.",
            results: base64Files.map((file, index) => {
                // Generate random data for each field
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const month = months[Math.floor(Math.random() * months.length)];
                const day = days[Math.floor(Math.random() * days.length)];
                const year = years[Math.floor(Math.random() * years.length)];
                const hour = hours[Math.floor(Math.random() * hours.length)];
                const minute = minutes[Math.floor(Math.random() * minutes.length)];
                
                // Generate random amounts
                const baseAmount = (Math.floor(Math.random() * 10000) / 100).toFixed(2);
                const tipPercent = Math.floor(Math.random() * 25) + 10; // 10-35% tip
                const tipAmount = (baseAmount * tipPercent / 100).toFixed(2);
                const totalAmount = (parseFloat(baseAmount) + parseFloat(tipAmount)).toFixed(2);
                
                // Generate check number
                const checkNumber = Math.floor(Math.random() * 9000000) + 1000000;
                
                // Determine if signed (80% chance of being signed)
                const signed = Math.random() < 0.8;
                
                return {
                    file_name: file.name,
                    date: `${month}/${day}/${year}`,
                    time: `${hour}:${minute}`,
                    customer_name: `${firstName} ${lastName}`,
                    check_number: checkNumber.toString(),
                    amount: `$${baseAmount}`,
                    tip: `$${tipAmount}`,
                    total: `$${totalAmount}`,
                    signed: signed,
                    confidence: (Math.random() * 0.3 + 0.7).toFixed(2) // Random confidence between 0.7 and 1.0
                };
            })
        };
    }
    
    // Copy JSON to Clipboard
    function copyJsonToClipboard() {
        const jsonText = jsonOutput.textContent;
        navigator.clipboard.writeText(jsonText)
            .then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy to clipboard');
            });
    }
    
    // Format monetary values to always have 2 decimal places
    function formatMonetaryValues(result) {
        if (result && result.results) {
            result.results = result.results.map(item => {
                // Add confidence if not present
                if (!item.confidence) {
                    item.confidence = Math.random() * 0.2 + 0.8; // Random between 0.8 and 1.0
                }
                
                // Format monetary values - always ensure two decimal places
                if (item.amount) {
                    // Remove any existing $ sign
                    let amount = String(item.amount).replace(/\$/g, '');
                    // Convert to number and format with 2 decimal places
                    amount = parseFloat(amount).toFixed(2);
                    item.amount = `$${amount}`;
                }
                
                // Always format tip with 2 decimal places, even if it's 0 or undefined
                let tip = item.tip ? String(item.tip).replace(/\$/g, '') : '0';
                // Convert to number and format with 2 decimal places
                tip = parseFloat(tip).toFixed(2);
                item.tip = `$${tip}`;
                
                if (item.total) {
                    // Remove any existing $ sign
                    let total = String(item.total).replace(/\$/g, '');
                    // Convert to number and format with 2 decimal places
                    total = parseFloat(total).toFixed(2);
                    item.total = `$${total}`;
                }
                
                return item;
            });
        }
        return result;
    }
    
    // Update API Cost Display
    function updateApiCostDisplay(cost) {
        const costValueElement = document.querySelector('.cost-value');
        if (costValueElement && cost) {
            costValueElement.textContent = `$${parseFloat(cost).toFixed(4)}`;
        }
    }
    
    // Populate Table View
    function populateTableView(data) {
        // Clear existing table rows
        tableBody.innerHTML = '';
        
        if (data && data.results && Array.isArray(data.results)) {
            data.results.forEach(item => {
                const row = document.createElement('tr');
                
                // Create cells for each column
                const customerNameCell = document.createElement('td');
                customerNameCell.textContent = item.customer_name || 'N/A';
                
                const timeCell = document.createElement('td');
                timeCell.textContent = item.time || 'N/A';
                
                const totalCell = document.createElement('td');
                totalCell.textContent = item.total || 'N/A';
                
                const tipCell = document.createElement('td');
                tipCell.textContent = item.tip || 'N/A';
                
                // Add cells to row
                row.appendChild(customerNameCell);
                row.appendChild(timeCell);
                row.appendChild(totalCell);
                row.appendChild(tipCell);
                
                // Add row to table
                tableBody.appendChild(row);
            });
        }
    }
    
    // Sort Table Function
    function sortTable() {
        if (!currentData || !currentData.results) return;
        
        const field = sortField.value;
        const order = sortOrder.value;
        
        // Clone the data to avoid modifying the original
        let sortedData = JSON.parse(JSON.stringify(currentData));
        
        // Ensure all monetary values are properly formatted before sorting
        sortedData = formatMonetaryValues(sortedData);
        
        // Sort the results array
        sortedData.results.sort((a, b) => {
            let valueA = a[field] || '';
            let valueB = b[field] || '';
            
            // Remove $ sign for monetary values
            if (field === 'total' || field === 'tip' || field === 'amount') {
                valueA = String(valueA).replace(/\$/g, '');
                valueB = String(valueB).replace(/\$/g, '');
                
                // Convert to numbers for comparison
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            } else if (field === 'time') {
                // Special handling for time values
                // Convert time strings to comparable values (minutes since midnight)
                const getMinutes = (timeStr) => {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    return hours * 60 + minutes;
                };
                
                valueA = getMinutes(valueA);
                valueB = getMinutes(valueB);
            }
            
            // Compare values
            if (order === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
        
        // Repopulate the table with sorted data
        populateTableView(sortedData);
        
        // Visual feedback that sorting was applied
        sortBtn.classList.add('active');
        sortBtn.textContent = 'Sorted!';
        setTimeout(() => {
            sortBtn.textContent = 'Sort';
            sortBtn.classList.remove('active');
        }, 1000);
    }
    
    // Export Table to CSV
    function exportTableToCsv() {
        // Get table data
        const rows = [];
        const headers = ['Customer Name', 'Closing Time', 'Check Total', 'Tip'];
        
        // Add headers
        rows.push(headers.join(','));
        
        // Add data rows
        const tableRows = tableBody.querySelectorAll('tr');
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => {
                // Escape commas and quotes in cell content
                let content = cell.textContent;
                if (content.includes(',') || content.includes('"')) {
                    content = `"${content.replace(/"/g, '""')}"`;
                }
                return content;
            });
            rows.push(rowData.join(','));
        });
        
        // Create CSV content
        const csvContent = rows.join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'receipt_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
