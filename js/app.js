// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

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
    const slideshowClose = document.querySelector('.slideshow-close');
    
    // Create a container for the editable slide counter
    let slideCounterInput;
    
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
    const TEST_MODE = false; // Set to true to enable sample images for testing
    
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
        if (selectedFiles.size >= 1 && selectedFiles.size <= 100) {
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
            // Call this after DOM is loaded
            setTimeout(addLightspeedIntegration, 500);
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
    
    // Fix for Tab Navigation - ensure the navigation between tabs works correctly
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Hide all tabs
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.classList.add('active');
                
                // If switching to organized tab, refresh the display
                if (tabId === 'organized-tab' && processedImages && processedImages.length > 0) {
                    displayOrganizedImages(processedImages);
                }
            }
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
    async function addFiles(files) {
        for (const file of files) {
            // Check if file is an image or PDF
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                alert(`${file.name} is not an image or PDF file.`);
                continue;
            }
            
            // If it's a PDF, check if it has multiple pages
            if (file.type === 'application/pdf') {
                try {
                    const pdfPages = await splitPdfIntoPages(file);
                    
                    // If PDF has multiple pages, add each page as a separate file
                    if (pdfPages.length > 1) {
                        console.log(`Splitting PDF "${file.name}" into ${pdfPages.length} pages`);
                        
                        // Add each page as a separate file
                        for (let i = 0; i < pdfPages.length; i++) {
                            const pageFile = pdfPages[i];
                            const fileId = nextFileId++;
                            selectedFiles.set(fileId, pageFile);
                            
                            // Create file preview for this page
                            createFilePreview(pageFile, fileId);
                        }
                    } else if (pdfPages.length === 1) {
                        // Single page PDF, just add it normally
                        const fileId = nextFileId++;
                        selectedFiles.set(fileId, pdfPages[0]);
                        createFilePreview(pdfPages[0], fileId);
                    }
                } catch (error) {
                    console.error('Error splitting PDF:', error);
                    // If there's an error splitting the PDF, add it as a single file
                    const fileId = nextFileId++;
                    selectedFiles.set(fileId, file);
                    createFilePreview(file, fileId);
                }
            } else {
                // For non-PDF files, add them normally
                const fileId = nextFileId++;
                selectedFiles.set(fileId, file);
                createFilePreview(file, fileId);
            }
        }
        
        updateFileCount();
        validateFileCount();
    }
    
    // Function to split a PDF into individual pages
    async function splitPdfIntoPages(pdfFile) {
        return new Promise(async (resolve, reject) => {
            try {
                // Read the PDF file as ArrayBuffer
                const arrayBuffer = await pdfFile.arrayBuffer();
                
                // Load the PDF document
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const numPages = pdf.numPages;
                
                console.log(`PDF has ${numPages} pages`);
                
                // If it's a single page PDF, just return the original file
                if (numPages === 1) {
                    resolve([pdfFile]);
                    return;
                }
                
                // Array to store individual page files
                const pageFiles = [];
                
                // Process each page
                for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                    // Create a new filename for this page
                    const pageFilename = pdfFile.name.replace('.pdf', `_page${pageNum}.pdf`);
                    
                    // Create a File object for this page
                    // Since we can't actually split the PDF in the browser, we'll create a reference
                    // to the original file but with metadata indicating which page it is
                    const pageFile = new File(
                        [arrayBuffer], // Use the same data
                        pageFilename,
                        { 
                            type: 'application/pdf',
                            lastModified: pdfFile.lastModified
                        }
                    );
                    
                    // Add custom properties to identify this as a specific page
                    pageFile.pdfPageNumber = pageNum;
                    pageFile.originalPdfName = pdfFile.name;
                    pageFile.totalPages = numPages;
                    
                    pageFiles.push(pageFile);
                }
                
                resolve(pageFiles);
            } catch (error) {
                console.error('Error splitting PDF:', error);
                reject(error);
            }
        });
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
        thumbnail.width = 40;
        thumbnail.height = 40;
        
        // Set appropriate icon based on file type
        if (file.type === 'application/pdf') {
            // PDF icon
            thumbnail.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlNzRjM2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTQgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjh6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iMTQgMiAxNCA4IDIwIDgiPjwvcG9seWxpbmU+PHBhdGggZD0iTTkgMTVoNiI+PC9wYXRoPjxwYXRoIGQ9Ik05IDExaDYiPjwvcGF0aD48L3N2Zz4=';
            
            // Add page number badge if this is a page from a multi-page PDF
            if (file.pdfPageNumber && file.totalPages > 1) {
                thumbnail.style.position = 'relative';
                
                // Create a small badge to show page number
                const pageBadge = document.createElement('div');
                pageBadge.style.position = 'absolute';
                pageBadge.style.top = '-5px';
                pageBadge.style.right = '-5px';
                pageBadge.style.backgroundColor = '#e74c3c';
                pageBadge.style.color = 'white';
                pageBadge.style.borderRadius = '50%';
                pageBadge.style.width = '18px';
                pageBadge.style.height = '18px';
                pageBadge.style.display = 'flex';
                pageBadge.style.alignItems = 'center';
                pageBadge.style.justifyContent = 'center';
                pageBadge.style.fontSize = '10px';
                pageBadge.style.fontWeight = 'bold';
                pageBadge.textContent = file.pdfPageNumber;
                
                // Append the badge to the thumbnail container
                fileName.appendChild(pageBadge);
            }
        } else {
            // Image file - create thumbnail with the actual image content
            const reader = new FileReader();
            reader.onload = (e) => {
                thumbnail.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
        
        // File name text
        const nameText = document.createElement('span');
        nameText.textContent = file.name;
        
        fileName.appendChild(thumbnail);
        fileName.appendChild(nameText);
        
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the parent click event
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
        processBtn.disabled = count < 1 || count > 100;
    }
    
    // Add event listener for the close button
    if (slideshowClose) {
        slideshowClose.addEventListener('click', () => {
            closeSlideshow();
        });
    }

    // Add event listener for clicking outside the modal content to close
    slideshowView.addEventListener('click', (e) => {
        if (e.target === slideshowView) {
            closeSlideshow();
        }
    });

    // Add keyboard navigation for slideshow
    document.addEventListener('keydown', (e) => {
        // Only handle keyboard events when slideshow is visible
        if (slideshowView.style.display === 'block') {
            switch (e.key) {
                case 'Escape':
                    closeSlideshow();
                    break;
                case 'ArrowLeft':
                    navigateSlideshow(-1); // Previous slide
                    break;
                case 'ArrowRight':
                    navigateSlideshow(1); // Next slide
                    break;
            }
        }
    });

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
            
            // Hide grid, show slideshow modal
            organizedGrid.style.display = 'grid'; // Keep grid visible behind modal
            slideshowView.style.display = 'block';
            
            // Initialize slideshow with current filtered images
            initializeSlideshow();
        }
    }

    // Close slideshow function
    function closeSlideshow() {
        slideshowView.style.display = 'none';
        gridViewBtn.classList.add('active');
        slideshowViewBtn.classList.remove('active');
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
    
    // Create an editable slide counter
    function createEditableSlideCounter() {
        // Create container for the counter
        const counterContainer = document.createElement('div');
        counterContainer.className = 'slide-counter-container';
        counterContainer.style.display = 'flex';
        counterContainer.style.alignItems = 'center';
        
        // Create input for current slide
        slideCounterInput = document.createElement('input');
        slideCounterInput.type = 'number';
        slideCounterInput.min = '1';
        slideCounterInput.max = processedImages.length.toString();
        slideCounterInput.value = (currentSlideIndex + 1).toString();
        slideCounterInput.style.width = '50px';
        slideCounterInput.style.textAlign = 'center';
        slideCounterInput.style.margin = '0 5px';
        slideCounterInput.style.padding = '3px';
        slideCounterInput.style.border = '1px solid #ccc';
        slideCounterInput.style.borderRadius = '4px';
        
        // Add event listener for input changes
        slideCounterInput.addEventListener('change', () => {
            let newIndex = parseInt(slideCounterInput.value) - 1;
            
            // Validate the input
            if (isNaN(newIndex) || newIndex < 0) {
                newIndex = 0;
            } else if (newIndex >= processedImages.length) {
                newIndex = processedImages.length - 1;
            }
            
            // Update the input value to reflect valid number
            slideCounterInput.value = (newIndex + 1).toString();
            
            // Jump to the specified slide
            if (newIndex !== currentSlideIndex) {
                currentSlideIndex = newIndex;
                displayCurrentSlide();
            }
        });
        
        // Create text for "of X" part
        const totalText = document.createElement('span');
        totalText.textContent = ` of ${processedImages.length}`;
        
        // Assemble the counter
        counterContainer.appendChild(document.createTextNode('Image '));
        counterContainer.appendChild(slideCounterInput);
        counterContainer.appendChild(totalText);
        
        return counterContainer;
    }
    
    // Enhanced function to display current slide in slideshow view
    function displayCurrentSlide() {
        if (!processedImages || processedImages.length === 0) {
            return;
        }
        
        // Get current image data
        const currentImage = processedImages[currentSlideIndex];
        
        // Update slide counter
        if (slideCounterInput) {
            slideCounterInput.value = (currentSlideIndex + 1).toString();
            slideCounterInput.max = processedImages.length.toString();
        } else {
            // Replace the static counter with an editable one
            const counterContainer = createEditableSlideCounter();
            slideCounter.innerHTML = '';
            slideCounter.appendChild(counterContainer);
        }
        
        // Update navigation button states
        prevSlideBtn.disabled = currentSlideIndex === 0;
        nextSlideBtn.disabled = currentSlideIndex === processedImages.length - 1;
        
        // Format the tip for display (just the number without $ sign)
        let formattedTip = 'N/A';
        if (currentImage.tip) {
            const tipMatch = String(currentImage.tip).match(/\$?(\d+(?:\.\d+)?)/);
            if (tipMatch && tipMatch[1]) {
                formattedTip = tipMatch[1];
            }
        }
        
        // Check if this is a PDF file
        const isPdf = currentImage.actual_filename && currentImage.actual_filename.toLowerCase().endsWith('.pdf');
        
        // Create slideshow content with customer name in uppercase
        slideshowImageContainer.innerHTML = `
            ${isPdf ? 
                `<div class="pdf-placeholder">
                    <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2U3NGMzYyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNCAxSDZhMiAyIDAgMCAwLTIgMnYxNmEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJWOHoiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPSIxNCAxIDE0IDggMjAgOCI+PC9wb2x5bGluZT48cGF0aCBkPSJNOSAxNWg2Ij48L3BhdGg+PHBhdGggZD0iTTkgMTFoNiI+PC9wYXRoPjwvc3ZnPg==" 
                        class="slideshow-image pdf-icon" 
                        alt="PDF ${currentSlideIndex + 1}">
                    <p class="pdf-filename">${currentImage.actual_filename || 'PDF Document'}</p>
                </div>` 
                : 
                `<img src="${currentImage.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM0OThkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cGF0aCBkPSJNMjEgMTVsLTMuOS0zLjktNi4xIDYuMS00LTQiLz48L3N2Zz4='}" 
                    class="slideshow-image" 
                    style="${currentImage.rotation ? `transform: rotate(${currentImage.rotation}deg);` : ''}"
                    alt="Receipt ${currentSlideIndex + 1}">`
            }
            <div class="slideshow-info">
                <h3>${currentImage.customer_name ? currentImage.customer_name.toUpperCase() : `RECEIPT ${currentSlideIndex + 1}`}</h3>
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
                        <div class="info-value tip">${formattedTip}</div>
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
    
    // Track current displayed images (filtered or all)
    let currentDisplayedImages = [];
    
    // Enhanced Filter Organized Images function
    function filterOrganizedImages() {
        console.log("Filtering images...");
        const field = filterField.value;
        const value = filterValue.value.toLowerCase();
        
        if (!value.trim() || !processedImages.length) {
            console.log("No filter value or no images to filter");
            currentDisplayedImages = [...processedImages];
            displayOrganizedImages(currentDisplayedImages);
            
            // If in slideshow view, reinitialize with all images
            if (slideshowView.style.display === 'block') {
                initializeSlideshow();
            }
            return;
        }
        
        console.log(`Filtering by ${field} with value: ${value}`);
        
        // Create a copy of the processed images for filtering
        const filteredImages = processedImages.filter(item => {
            // Skip items that don't have the field
            if (!item[field]) {
                console.log(`Item missing field: ${field}`);
                return false;
            }
            
            // Get the field value and convert to lowercase for case-insensitive comparison
            let fieldValue = String(item[field]).toLowerCase();
            
            // Special handling for monetary values - remove $ sign
            if (field === 'total' || field === 'tip' || field === 'amount') {
                fieldValue = fieldValue.replace(/\$/g, '');
            }
            
            // Check if the field value includes the search term
            const matches = fieldValue.includes(value);
            return matches;
        });
        
        console.log(`Found ${filteredImages.length} matching images`);
        
        // Update current displayed images
        currentDisplayedImages = [...filteredImages];
        
        // Display the filtered images
        displayOrganizedImages(currentDisplayedImages);
        
        // If in slideshow view, update the slideshow with filtered images
        if (slideshowView.style.display === 'block') {
            // Initialize the slideshow with the filtered images
            initializeSlideshow();
        }
    }
    
    // Display organized images in grid view
    function displayOrganizedImages(images) {
        // Clear the grid
        organizedGrid.innerHTML = '';
        
        if (!images || images.length === 0) {
            // Show empty state
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = '<p>No images have been processed yet. Use the Scanner tab to process images first.</p>';
            organizedGrid.appendChild(emptyState);
            return;
        }
        
        console.log(`Displaying ${images.length} organized images`);
        
        // Store the current displayed images
        currentDisplayedImages = [...images];
        
        // Create image cards
        images.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'image-card';
            
            // Check if this is a PDF file
            const isPdf = item.actual_filename && item.actual_filename.toLowerCase().endsWith('.pdf');
            
            // Create image preview container with rotation controls
            const previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview-container';
            previewContainer.style.position = 'relative';
            
            // Create image preview
            const imgPreview = document.createElement('img');
            imgPreview.className = 'image-preview';
            
            // Add rotation controls for non-PDF files
            if (!isPdf) {
                // Create rotation controls
                const rotationControls = document.createElement('div');
                rotationControls.className = 'rotation-controls';
                rotationControls.style.position = 'absolute';
                rotationControls.style.bottom = '5px';
                rotationControls.style.right = '5px';
                rotationControls.style.display = 'flex';
                rotationControls.style.gap = '5px';
                
                // Rotate left button
                const rotateLeftBtn = document.createElement('button');
                rotateLeftBtn.className = 'rotate-btn rotate-left';
                rotateLeftBtn.innerHTML = '&#8634;'; // Counter-clockwise arrow
                rotateLeftBtn.style.backgroundColor = '#3498db';
                rotateLeftBtn.style.color = 'white';
                rotateLeftBtn.style.border = 'none';
                rotateLeftBtn.style.borderRadius = '50%';
                rotateLeftBtn.style.width = '30px';
                rotateLeftBtn.style.height = '30px';
                rotateLeftBtn.style.fontSize = '16px';
                rotateLeftBtn.style.cursor = 'pointer';
                rotateLeftBtn.style.display = 'flex';
                rotateLeftBtn.style.alignItems = 'center';
                rotateLeftBtn.style.justifyContent = 'center';
                rotateLeftBtn.title = 'Rotate left';
                
                // Rotate right button
                const rotateRightBtn = document.createElement('button');
                rotateRightBtn.className = 'rotate-btn rotate-right';
                rotateRightBtn.innerHTML = '&#8635;'; // Clockwise arrow
                rotateRightBtn.style.backgroundColor = '#3498db';
                rotateRightBtn.style.color = 'white';
                rotateRightBtn.style.border = 'none';
                rotateRightBtn.style.borderRadius = '50%';
                rotateRightBtn.style.width = '30px';
                rotateRightBtn.style.height = '30px';
                rotateRightBtn.style.fontSize = '16px';
                rotateRightBtn.style.cursor = 'pointer';
                rotateRightBtn.style.display = 'flex';
                rotateRightBtn.style.alignItems = 'center';
                rotateRightBtn.style.justifyContent = 'center';
                rotateRightBtn.title = 'Rotate right';
                
                // Initialize rotation state if not present
                if (!item.rotation) {
                    item.rotation = 0;
                }
                
                // Apply current rotation
                imgPreview.style.transform = `rotate(${item.rotation}deg)`;
                
                // Add rotation event handlers
                rotateLeftBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click event
                    item.rotation = (item.rotation - 90) % 360;
                    imgPreview.style.transform = `rotate(${item.rotation}deg)`;
                });
                
                rotateRightBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click event
                    item.rotation = (item.rotation + 90) % 360;
                    imgPreview.style.transform = `rotate(${item.rotation}deg)`;
                });
                
                // Add buttons to rotation controls
                rotationControls.appendChild(rotateLeftBtn);
                rotationControls.appendChild(rotateRightBtn);
                
                // Add rotation controls to preview container
                previewContainer.appendChild(rotationControls);
            }
            
            // Add image to preview container
            previewContainer.appendChild(imgPreview);
            
            if (isPdf) {
                // Use PDF icon for PDF files
                imgPreview.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2U3NGMzYyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNCAxSDZhMiAyIDAgMCAwLTIgMnYxNmEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJWOHoiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPSIxNCAxIDE0IDggMjAgOCI+PC9wb2x5bGluZT48cGF0aCBkPSJNOSAxNWg2Ij48L3BhdGg+PHBhdGggZD0iTTkgMTFoNiI+PC9wYXRoPjwvc3ZnPg==';
                
                // Check if this is a page from a multi-page PDF by looking at the filename
                const pageMatch = item.actual_filename.match(/_page(\d+)\.pdf$/i);
                if (pageMatch) {
                    // Create a badge to show page number
                    const pageBadge = document.createElement('div');
                    pageBadge.style.position = 'absolute';
                    pageBadge.style.top = '5px';
                    pageBadge.style.right = '5px';
                    pageBadge.style.backgroundColor = '#e74c3c';
                    pageBadge.style.color = 'white';
                    pageBadge.style.borderRadius = '50%';
                    pageBadge.style.width = '30px';
                    pageBadge.style.height = '30px';
                    pageBadge.style.display = 'flex';
                    pageBadge.style.alignItems = 'center';
                    pageBadge.style.justifyContent = 'center';
                    pageBadge.style.fontSize = '14px';
                    pageBadge.style.fontWeight = 'bold';
                    pageBadge.textContent = pageMatch[1]; // Page number
                    
                    // Add the badge to the container
                    previewContainer.appendChild(pageBadge);
                }
            } else {
                // Use the assigned imageUrl for image files
                imgPreview.src = item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTAiIGhlaWdodD0iMTgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM0OThkYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cGF0aCBkPSJNMjEgMTVsLTMuOS0zLjktNi4xIDYuMS00LTQiLz48L3N2Zz4=';
            }
            imgPreview.alt = `Receipt ${index + 1}`;
            
            // Create info section
            const infoDiv = document.createElement('div');
            infoDiv.className = 'image-info';
            
            // Add customer name as title (using uppercase format)
            const title = document.createElement('h4');
            title.textContent = item.customer_name ? item.customer_name.toUpperCase() : `RECEIPT ${index + 1}`;
            
            // Add other details
            const timeP = document.createElement('p');
            timeP.textContent = `Time: ${item.time || 'N/A'}`;
            
            const totalP = document.createElement('p');
            totalP.textContent = `Total: ${item.total || 'N/A'}`;
            
            const tipP = document.createElement('p');
            tipP.className = 'tip-amount';
            
            // Format the tip to match your screenshot (just the number, no $ sign)
            let tipValue = 'N/A';
            if (item.tip) {
                // Remove the dollar sign and get just the number
                const tipMatch = String(item.tip).match(/\$?(\d+(?:\.\d+)?)/);
                if (tipMatch && tipMatch[1]) {
                    tipValue = tipMatch[1];
                }
            }
            tipP.textContent = `Tip: ${tipValue}`;
            
            // Assemble the card
            infoDiv.appendChild(title);
            infoDiv.appendChild(timeP);
            infoDiv.appendChild(totalP);
            infoDiv.appendChild(tipP);
            
            // Add the info div to the card
            card.appendChild(previewContainer);
            card.appendChild(infoDiv);
            
            // Add click event handler to show the image in slideshow view
            card.addEventListener('click', () => {
                // Set the current slide to this specific image
                currentSlideIndex = index;
                
                // Open slideshow with the current displayed images (filtered or all)
                setViewMode('slideshow');
                
                // Display the clicked image
                displayCurrentSlide();
            });
            
            organizedGrid.appendChild(card);
        });
        
        console.log("Completed organizing images");
    }
    
    // Process images function
    async function processImages() {
        if (selectedFiles.size < 1 || selectedFiles.size > 100) {
            alert('Please select between 1 and 100 images.');
            return;
        }
        
        // Show results section
        resultsSection.style.display = 'block';
        
        // Reset progress and output
        progressBar.style.width = '0%';
        jsonOutput.textContent = 'Processing...';
        tableBody.innerHTML = ''; // Clear table
        
        try {
            // Store the original files in an array for easy indexing
            const originalFiles = Array.from(selectedFiles.values());
            
            // Convert files to base64 for processing
            const filePromises = originalFiles.map(file => {
                return fileToBase64(file);
            });
            const base64Files = await Promise.all(filePromises);
            
            // Process with API
            const result = await processWithClaudeAPI(base64Files);
            
            // Store the current data
            currentData = result;
            
            // Display result in JSON viewer
            jsonOutput.textContent = JSON.stringify(result, null, 2);
            progressBar.style.width = '100%';
            
            // Store processed images for organized tab
            processedImages = result.results || [];
            
            // IMPORTANT: Assign images by index rather than trying to match file names
            if (processedImages.length > 0) {
                // Make sure we have the same number of processed results as uploaded files
                // If not, we'll use as many as we can
                const maxItems = Math.min(originalFiles.length, processedImages.length);
                
                // Assign image URLs by index
                for (let i = 0; i < maxItems; i++) {
                    // Create URL from the original file
                    processedImages[i].imageUrl = URL.createObjectURL(originalFiles[i]);
                    
                    // Store the actual file name for reference
                    processedImages[i].actual_filename = originalFiles[i].name;
                    
                    // Format customer name for uppercase display
                    if (processedImages[i].customer_name) {
                        processedImages[i].customer_name = processedImages[i].customer_name.toUpperCase();
                    }
                }
                
                console.log("Successfully mapped images to API results");
            }
            
            // Populate table view
            populateTableView(result);
            
            // IMPORTANT: Update organized images tab with our modified data
            displayOrganizedImages(processedImages);
            
            // CRITICAL FIX: Automatically switch to the Organized Images tab
            setTimeout(() => {
                // Find the Organized Images tab and click it
                const organizedTabItem = document.querySelector('.nav-item[data-tab="organized-tab"]');
                if (organizedTabItem) {
                    organizedTabItem.click();
                }
            }, 500);
            
        } catch (error) {
            console.error('Error processing images:', error);
            jsonOutput.textContent = `Error: ${error.message}`;
            progressBar.style.width = '100%';
        }
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
        
        try {
            // Use the backend proxy server to call Claude API
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
            
            // Update API cost display if available
            if (result.api_cost && result.api_cost.total_cost) {
                const costValueElement = document.querySelector('.cost-value');
                if (costValueElement) {
                    costValueElement.textContent = `$${parseFloat(result.api_cost.total_cost).toFixed(4)}`;
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error calling Claude API:', error);
            progressBar.style.width = '100%';
            throw new Error(`API Error: ${error.message}. Please ensure your API key is correctly set in the .env file and the server is running.`);
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
    
    // Export Table to CSV
    function exportTableToCsv() {
        // Get table data
        const rows = [];
        const headers = ['Customer Name', 'Time', 'Total', 'Tip'];
        
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
    
    // Add Lightspeed integration button to UI
    function addLightspeedIntegration() {
        // Find a good place to add the button (e.g., next to other controls)
        const filterControls = document.querySelector('.filter-controls');
        if (!filterControls) return;
        
        // Create Lightspeed button group
        const lightspeedGroup = document.createElement('div');
        lightspeedGroup.className = 'lightspeed-controls';
        lightspeedGroup.style.marginLeft = 'auto';
        lightspeedGroup.style.display = 'flex';
        lightspeedGroup.style.alignItems = 'center';
        lightspeedGroup.style.gap = '10px';
        
        // Create upload button
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'upload-btn';
        uploadBtn.textContent = 'Upload to Lightspeed';
        uploadBtn.style.backgroundColor = '#2ecc71';
        uploadBtn.style.color = 'white';
        uploadBtn.style.border = 'none';
        uploadBtn.style.borderRadius = '4px';
        uploadBtn.style.padding = '0.5rem 1rem';
        uploadBtn.style.cursor = 'pointer';
        
        // Add click event
        uploadBtn.addEventListener('click', () => {
            alert('Lightspeed integration would happen here in a real implementation.');
        });
        
        lightspeedGroup.appendChild(uploadBtn);
        
        // Add to filter controls
        filterControls.appendChild(lightspeedGroup);
    }
});
