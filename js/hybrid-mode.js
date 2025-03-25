/**
 * Hybrid Mode - Progressive Enhancement for Receipt Processing
 * 
 * This script adds progressive enhancement to the receipt processing feature:
 * 1. Quick local processing shows preliminary results immediately
 * 2. More accurate API processing updates the results after a short delay
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the try-it-out page
    const renderButton = document.getElementById('renderButton');
    if (!renderButton) return;
    
    // Override the render button click handler
    renderButton.addEventListener('click', processImagesProgressively, { once: false });
    
    // Add hybrid mode indicator if coming from hybrid mode pages
    if (document.referrer.includes('hybrid-mode.html') || 
        document.referrer.includes('hybrid-try-it-out.html') || 
        window.location.search.includes('hybrid=true')) {
        const hybridBanner = document.createElement('div');
        hybridBanner.className = 'hybrid-model-banner';
        hybridBanner.textContent = 'HYBRID MODEL - PROGRESSIVE ENHANCEMENT ACTIVE';
        document.body.insertBefore(hybridBanner, document.body.firstChild);
        
        // Adjust the images-count and batch-mode-indicator positions
        const imagesCount = document.getElementById('imagesCount');
        const batchModeIndicator = document.getElementById('batchModeIndicator');
        
        if (imagesCount) {
            imagesCount.style.top = '50px';
        }
        
        if (batchModeIndicator) {
            batchModeIndicator.style.top = '50px';
        }
    }
    
    /**
     * Process images with progressive enhancement
     * @param {Event} event - The click event
     */
    function processImagesProgressively(event) {
        // Prevent default behavior
        event.preventDefault();
        
        // Get selected files
        const selectedFiles = window.selectedFiles || [];
        if (selectedFiles.length === 0) {
            alert('Please select at least one image first.');
            return;
        }
        
        // Get render button container
        const renderButtonContainer = document.getElementById('renderButtonContainer');
        
        // Show loading state
        renderButton.disabled = true;
        renderButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Quick scan in progress...</span>';
        
        // Process with progressive enhancement
        processWithProgressiveEnhancement(selectedFiles, renderButtonContainer);
    }
    
    /**
     * Process images with progressive enhancement
     * @param {Array} selectedFiles - Array of selected image files
     * @param {HTMLElement} renderButtonContainer - Container for render button
     */
    async function processWithProgressiveEnhancement(selectedFiles, renderButtonContainer) {
        try {
            // Convert selected files to base64
            const base64Files = await Promise.all(selectedFiles.map(async (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64String = e.target.result;
                        const base64Data = base64String.split(',')[1];
                        resolve({
                            name: file.name,
                            type: file.type,
                            data: base64Data
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }));
            
            // Process all images with local OCR (quick but less accurate)
            const quickResultsPromises = base64Files.map(file => performLocalOCR(file.data));
            const quickResultsArray = await Promise.all(quickResultsPromises);
            
            // Display preliminary results for all images
            renderButtonContainer.innerHTML = createMultipleResultsContainer(quickResultsArray, true);
            
            // Add reset button functionality
            document.getElementById('resetButton').addEventListener('click', resetProcessing);
            
            // In the background, process all images with API (slower but more accurate)
            const accurateResultsPromises = base64Files.map(file => processWithClaudeAPI(file.data));
            const accurateResultsArray = await Promise.all(accurateResultsPromises);
            
            // Update with more accurate results for all images
            renderButtonContainer.innerHTML = createMultipleResultsContainer(accurateResultsArray, false);
            
            // Re-add reset button functionality
            document.getElementById('resetButton').addEventListener('click', resetProcessing);
            
        } catch (error) {
            console.error('Error processing images:', error);
            
            // Show error message
            renderButtonContainer.innerHTML = `
                <div class="results-container error">
                    <h3>Error Processing Receipt</h3>
                    <p>There was an error processing your receipt: ${error.message}</p>
                    <div class="action-buttons">
                        <button class="reset-btn" id="resetButton">
                            <i class="fas fa-redo"></i>
                            <span>Try Again</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Add reset button functionality
            document.getElementById('resetButton').addEventListener('click', resetProcessing);
        }
    }
    
    /**
     * Reset the processing UI
     */
    function resetProcessing() {
        // Call the original clearAllFiles function if it exists
        if (typeof window.clearAllFiles === 'function') {
            window.clearAllFiles();
        } else {
            // Fallback
            window.selectedFiles = [];
            const fileInput = document.getElementById('fileInput');
            const cameraInput = document.getElementById('cameraInput');
            if (fileInput) fileInput.value = '';
            if (cameraInput) cameraInput.value = '';
            
            // Update UI
            const uploadPlaceholder = document.querySelector('.upload-placeholder');
            const previewContainer = document.getElementById('previewContainer');
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
            if (previewContainer) previewContainer.style.display = 'none';
        }
        
        // Restore render button
        const renderButtonContainer = document.getElementById('renderButtonContainer');
        renderButtonContainer.innerHTML = `
            <button class="render-btn" id="renderButton">
                <i class="fas fa-magic"></i>
                <span>Process All Receipts</span>
            </button>
            <button class="clear-btn" id="clearButton">
                <i class="fas fa-trash"></i>
                <span>Clear All</span>
            </button>
        `;
        
        // Re-add event listeners
        document.getElementById('renderButton').addEventListener('click', processImagesProgressively);
        document.getElementById('clearButton').addEventListener('click', function() {
            if (typeof window.clearAllFiles === 'function') {
                window.clearAllFiles();
            }
        });
    }
    
    /**
     * Simulated local OCR function (quick but less accurate)
     * @param {string} imageData - Base64 encoded image data
     * @returns {Promise<Object>} - Promise resolving to the OCR results
     */
    async function performLocalOCR(imageData) {
        console.log('Performing local OCR on image data...');
        
        // Simulate processing time (500-1500ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Generate random values to simulate different receipts
        const establishments = ['Local Bar & Grill', 'City Tavern', 'The Pub', 'Corner Bistro'];
        const amounts = ['$45.00', '$32.75', '$28.50', '$51.25'];
        const tips = ['$9.00', '$6.55', '$5.70', '$10.25'];
        const totals = ['$54.00', '$39.30', '$34.20', '$61.50'];
        const checkNumbers = ['1234', '5678', '9012', '3456'];
        const customers = ['Customer', 'Guest', 'Table 5', 'Patron'];
        const paymentTypes = ['Credit Card', 'Cash', 'Debit Card', 'Mobile Payment'];
        
        // Pick random index for this receipt
        const randomIndex = Math.floor(Math.random() * establishments.length);
        
        // Return simulated results (less accurate)
        return {
            establishment: establishments[randomIndex],
            amount: amounts[randomIndex],
            tip: tips[randomIndex],
            total: totals[randomIndex],
            check_number: checkNumbers[randomIndex],
            date: '03/21/2025',
            customer_name: customers[randomIndex],
            payment_type: paymentTypes[randomIndex],
            signed: Math.random() > 0.2, // 80% chance of being signed
            confidence: 0.55 + (Math.random() * 0.2) // Confidence between 0.55-0.75
        };
    }
    
    /**
     * Simulated API processing function (slower but more accurate)
     * @param {string} imageData - Base64 encoded image data
     * @returns {Promise<Object>} - Promise resolving to the API results
     */
    async function processWithClaudeAPI(imageData) {
        console.log('Processing with Claude API...');
        
        // Simulate API processing time (2-4 seconds)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 2000));
        
        // Generate random values to simulate different receipts with more accurate data
        const establishments = ['Downtown Bar & Grill', 'City Tavern & Restaurant', 'The Neighborhood Pub', 'Corner Street Bistro'];
        const amounts = ['$42.50', '$31.75', '$27.50', '$49.95'];
        const tips = ['$8.50', '$6.35', '$5.50', '$9.99'];
        const totals = ['$51.00', '$38.10', '$33.00', '$59.94'];
        const checkNumbers = ['1234', '5678', '9012', '3456'];
        const dates = ['03/21/2025', '03/20/2025', '03/19/2025', '03/21/2025'];
        const customers = ['John Smith', 'Jane Doe', 'Alex Johnson', 'Sam Wilson'];
        const paymentTypes = ['Visa ****1234', 'Mastercard ****5678', 'Amex ****9012', 'Discover ****3456'];
        
        // Pick random index for this receipt
        const randomIndex = Math.floor(Math.random() * establishments.length);
        
        // Return simulated results (more accurate)
        return {
            establishment: establishments[randomIndex],
            amount: amounts[randomIndex],
            tip: tips[randomIndex],
            total: totals[randomIndex],
            check_number: checkNumbers[randomIndex],
            date: dates[randomIndex],
            customer_name: customers[randomIndex],
            payment_type: paymentTypes[randomIndex],
            signed: true, // Always signed in accurate results
            confidence: 0.85 + (Math.random() * 0.15) // Confidence between 0.85-1.0
        };
    }
    
    /**
     * Create results container HTML for a single result
     * @param {Object} result - The processing results
     * @param {boolean} isPreliminary - Whether these are preliminary results
     * @param {number} index - The index of the result
     * @returns {string} - HTML for the results container
     */
    function createResultsContainer(result, isPreliminary = false, index = 0) {
        return `
            <div class="results-container ${isPreliminary ? 'preliminary' : ''}">
                <h3>Receipt ${index + 1} Analysis Results ${isPreliminary ? '(Preliminary)' : ''}</h3>
                <p class="confidence-score" style="color: #666; margin-bottom: 1rem; font-style: italic; text-align: center;">
                    Confidence Score: ${(result.confidence * 100).toFixed(1)}%
                    ${isPreliminary ? '<span style="color: #ff6b6b; margin-left: 10px;">(Improving results in background...)</span>' : ''}
                </p>
                ${result.confidence < 0.8 ? `
                <div class="alert-message" style="background-color: #ffebee; color: #d32f2f; padding: 10px; border-radius: 5px; margin-bottom: 1rem; text-align: center; font-weight: bold;">
                    <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                    ${isPreliminary ? 'Preliminary results may be less accurate. Better results coming soon...' : 'Upload receipt with better lighting, less blurry, or clearer text'}
                </div>
                ` : ''}
                <div class="result-item" style="background-color: var(--secondary-yellow); font-weight: bold;">
                    <div class="result-label">Bar Name:</div>
                    <div class="result-value">${result.establishment || 'Not detected'}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Amount:</div>
                    <div class="result-value">${result.amount || 'Not detected'}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Tip:</div>
                    <div class="result-value">${result.tip || 'Not detected'}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Total:</div>
                    <div class="result-value">${result.total || 'Not detected'}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Check Number:</div>
                    <div class="result-value">${result.check_number || 'Not detected'}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Date:</div>
                    <div class="result-value">${result.date || 'Not detected'}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Customer:</div>
                    <div class="result-value">${result.customer_name || 'Not detected'}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Payment Type:</div>
                    <div class="result-value">${result.payment_type || 'Not detected'}</div>
                </div>
                <div class="result-item">
                    <div class="result-label">Signed:</div>
                    <div class="result-value">${result.signed ? 'Yes' : 'No'}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create results container HTML for multiple results
     * @param {Array} results - Array of processing results
     * @param {boolean} isPreliminary - Whether these are preliminary results
     * @returns {string} - HTML for the results container
     */
    function createMultipleResultsContainer(results, isPreliminary = false) {
        let html = `
            <div class="multiple-results-container">
                <h3>Receipt Analysis Results ${isPreliminary ? '(Preliminary)' : ''}</h3>
                <p style="color: #666; margin-bottom: 1rem; font-style: italic; text-align: center;">
                    ${results.length} receipts processed
                    ${isPreliminary ? '<span style="color: #ff6b6b; margin-left: 10px;">(Improving results in background...)</span>' : ''}
                </p>
        `;
        
        // Add each result
        results.forEach((result, index) => {
            html += `
                <div class="result-section" style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: ${index % 2 === 0 ? '#f9f9f9' : '#fff'}">
                    ${createResultsContainer(result, isPreliminary, index)}
                </div>
            `;
        });
        
        // Add action buttons at the end
        html += `
                <div class="action-buttons" style="margin-top: 20px;">
                    <button class="reset-btn" id="resetButton">
                        <i class="fas fa-redo"></i>
                        <span>Try Another Receipt</span>
                    </button>
                    <a href="admin.html" class="full-features-btn">
                        <i class="fas fa-cogs"></i>
                        <span>Use Full Features</span>
                    </a>
                </div>
            </div>
        `;
        
        return html;
    }
});
