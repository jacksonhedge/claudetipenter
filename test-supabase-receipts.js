
/**
 * Test script for Supabase receipts
 * This script tests the functionality of loading receipts from the Supabase storage bin
 */

// Supabase configuration
const SUPABASE_URL = 'https://gmysjdndtqwkjvrngnze.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdteXNqZG5kdHF3a2p2cm5nbnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzI0MzEsImV4cCI6MjA1OTI0ODQzMX0.3NGSsqVFha767BLiNkbDuv_i_Tp2n_vpcQxVvDLseGM';

// Initialize Supabase client
let supabaseClient;

// DOM Elements
const logContainer = document.getElementById('log-container');
const testStorageBtn = document.getElementById('test-storage-btn');
const totalTipsElement = document.getElementById('total-tips');
const tipAmountInput = document.getElementById('tip-amount-input');
const updateTipBtn = document.getElementById('update-tip-btn');
const clearTipBtn = document.getElementById('clear-tip-btn');
const barFilterSelect = document.getElementById('bar-filter');
const posFilterSelect = document.getElementById('pos-filter');
const dateFilterInput = document.getElementById('date-filter');
const limitFilterSelect = document.getElementById('limit-filter');
const dbNotification = document.getElementById('db-notification');

// Slideshow Elements
const slideshowContainer = document.getElementById('slideshow-container');
const slideshowImageContainer = document.getElementById('slideshow-image-container');
const prevSlideBtn = document.getElementById('prev-slide-btn');
const nextSlideBtn = document.getElementById('next-slide-btn');
const slideshowCounter = document.getElementById('slideshow-counter');
const receiptCustomer = document.getElementById('receipt-customer');
const receiptAmount = document.getElementById('receipt-amount');
const receiptTip = document.getElementById('receipt-tip');

// Slideshow state
let currentSlideIndex = 0;
let slideshowImages = [];

// Initialize the test
function initTest() {
    // Check if Supabase is loaded
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        log('Supabase client initialized successfully');
        
        // Set up event listeners
        testStorageBtn.addEventListener('click', loadReceiptsFromStorage);
        prevSlideBtn.addEventListener('click', () => navigateSlideshow(-1));
        nextSlideBtn.addEventListener('click', () => navigateSlideshow(1));
        updateTipBtn.addEventListener('click', updateTipAmount);
        clearTipBtn.addEventListener('click', clearTipAmount);
        
        // Set up filter event listeners
        barFilterSelect.addEventListener('change', loadReceiptsFromStorage);
        posFilterSelect.addEventListener('change', loadReceiptsFromStorage);
        dateFilterInput.addEventListener('change', loadReceiptsFromStorage);
        limitFilterSelect.addEventListener('change', loadReceiptsFromStorage);
        
        // Set the date filter to the current date
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        dateFilterInput.value = formattedDate;
        log(`Setting initial date filter to today: ${formattedDate}`);
        
        // Set up keyboard navigation
        document.addEventListener('keydown', handleKeyboardNavigation);
        
        // Set up tip amount input formatting
        tipAmountInput.addEventListener('input', formatTipAmount);
        
        // Prevent the tip amount from resetting when clicking the text box
        tipAmountInput.addEventListener('focus', function(e) {
            // Store the current value
            const currentValue = e.target.value;
            
            // Use setTimeout to prevent the browser from selecting all text
            setTimeout(() => {
                // If the value was changed (cleared), restore it
                if (e.target.value !== currentValue) {
                    e.target.value = currentValue;
                }
                
                // Move cursor to the end only if the input type supports selection
                if (e.target.type === 'text') {
                    const length = e.target.value.length;
                    e.target.setSelectionRange(length, length);
                }
            }, 0);
        });
        
        // Set up Enter key to submit tip update
        tipAmountInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateTipAmount();
            }
        });
        
        // Load initial receipts from storage with the date filter applied
        loadReceiptsFromStorage();
    } else {
        logError('Supabase client not loaded. Make sure to include the Supabase CDN in your HTML file.');
    }
}

// Handle keyboard navigation
function handleKeyboardNavigation(e) {
    // Only handle keyboard events when slideshow has images
    if (slideshowImages.length === 0) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            navigateSlideshow(-1); // Previous slide
            break;
        case 'ArrowRight':
            navigateSlideshow(1); // Next slide
            break;
    }
}

// Format tip amount as currency
function formatTipAmount(e) {
    // Get the raw input value
    let value = e.target.value;
    
    // Remove any non-digit characters
    value = value.replace(/\D/g, '');
    
    // Convert to cents (as an integer)
    const cents = parseInt(value, 10);
    
    // Handle empty or invalid input
    if (isNaN(cents) || cents === 0) {
        // Don't format empty input
        if (value === '') {
            return;
        }
        
        // Format as cents
        const formattedValue = (cents / 100).toFixed(2);
        e.target.value = formattedValue;
        return;
    }
    
    // Format the value as dollars and cents
    const dollars = cents / 100;
    const formattedValue = dollars.toFixed(2);
    
    // Update the input value
    e.target.value = formattedValue;
}

// Update tip amount for the current receipt
async function updateTipAmount() {
    if (slideshowImages.length === 0 || currentSlideIndex < 0 || currentSlideIndex >= slideshowImages.length) {
        logWarning('No receipt selected to update tip amount');
        return;
    }
    
    // Get the current receipt
    const receipt = slideshowImages[currentSlideIndex];
    
    // Get the new tip amount
    const newTipAmount = parseFloat(tipAmountInput.value);
    
    // Validate the tip amount
    if (isNaN(newTipAmount) || newTipAmount < 0) {
        logError('Invalid tip amount. Please enter a valid number.');
        return;
    }
    
    log(`Updating tip amount for receipt: ${receipt.customer_name} from $${receipt.tip_amount ? receipt.tip_amount.toFixed(2) : '0.00'} to $${newTipAmount.toFixed(2)}`);
    
    try {
        // Create a unique key for this receipt to store in localStorage
        const receiptKey = `receipt_${receipt.bar_name}_${receipt.customer_name}_${receipt.amount}`.replace(/\s+/g, '_');
        
        // Get existing tip updates from localStorage
        let tipUpdates = {};
        const savedTipUpdates = localStorage.getItem('tipenter_tip_updates');
        if (savedTipUpdates) {
            tipUpdates = JSON.parse(savedTipUpdates);
        }
        
        // Save this tip update
        tipUpdates[receiptKey] = newTipAmount;
        localStorage.setItem('tipenter_tip_updates', JSON.stringify(tipUpdates));
        
        log(`Saved tip update to localStorage with key: ${receiptKey}`);
        
        // Try to update in database if we have a receipt_id
        if (receipt.receipt_id) {
            // If we have a receipt ID, update in the database
            const { error } = await supabaseClient
                .from('receipts_backup')
                .update({ tip_amount: newTipAmount })
                .eq('id', receipt.receipt_id);
            
            if (error) {
                logWarning(`Database update failed, but tip is saved locally: ${error.message}`);
            } else {
                log(`Successfully updated tip amount in database for receipt ID: ${receipt.receipt_id}`);
                // Show database update notification
                showNotification('Tip amount updated in database!', 'success');
            }
        } else {
            // Show local storage notification instead
            showNotification('Tip amount saved locally!', 'success');
        }
        
        // Update the receipt in the local array
        receipt.tip_amount = newTipAmount;
        
        // Update the receipt tip display
        receiptTip.textContent = `$${newTipAmount.toFixed(2)}`;
        
        // Update the total tips display
        const totalTips = slideshowImages.reduce((sum, r) => sum + (r.tip_amount || 0), 0);
        totalTipsElement.textContent = `$${totalTips.toFixed(2)}`;
        
        // Update the table display
        createReceiptsFromStorage(slideshowImages);
        
        log('Tip amount updated successfully');
        
        // Automatically move to the next slide if not at the end
        if (currentSlideIndex < slideshowImages.length - 1) {
            navigateSlideshow(1);
        } else {
            log('Reached the last receipt. No more receipts to navigate to.');
        }
    } catch (error) {
        logError(`Error updating tip amount: ${error.message}`);
    }
}

// Load receipts from database
async function loadReceiptsFromStorage() {
    try {
        log('Loading receipts from storage...');
        
        // Reset stats
        totalTipsElement.textContent = "$0.00";
        
        // Get filter values
        const barFilter = barFilterSelect.value;
        const posFilter = posFilterSelect.value;
        const dateFilter = dateFilterInput.value;
        const limitFilter = parseInt(limitFilterSelect.value, 10);
        
        log(`Applying filters - Bar: ${barFilter}, POS: ${posFilter}, Date: ${dateFilter}, Limit: ${limitFilter}`);
        
        // Try to load from storage directly instead of the database table
        try {
            // Call testStorage to get receipts directly from storage
            const processedReceipts = await testStorage();
            return processedReceipts;
        } catch (storageError) {
            logError(`Error loading from storage: ${storageError.message}`);
            
            // Fallback to database if storage fails
            log('Falling back to database table...');
            
            // Get receipts from the receipts_backup table
            const { data: receipts, error } = await supabaseClient
                .from('receipts_backup')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            log(`Found ${receipts ? receipts.length : 0} receipts in the database`);
            
            if (!receipts || receipts.length === 0) {
                log('No receipts found in the receipts_backup table.');
                return [];
            }
            
            // Process the receipts
            const processedReceipts = receipts.map(receipt => {
                return {
                    receipt_id: receipt.id,
                    bar_name: receipt.merchant_name || 'Unknown Bar',
                    customer_name: receipt.customer_name || 'Unknown',
                    amount: receipt.subtotal || receipt.total || 0,
                    tip_amount: receipt.tip_amount || 0,
                    image_url: receipt.image_url,
                    created_at: receipt.created_at || new Date().toISOString(),
                    status: receipt.status || 'pending'
                };
            });
            
            log(`Processed ${processedReceipts.length} receipts from database`);
            
            // Display the receipts
            displayReceiptsFromStorage(processedReceipts);
            
            return processedReceipts;
        }
    } catch (error) {
        logError(`Error loading receipts: ${error.message}`);
        return [];
    }
}

// Display receipts from storage
function displayReceiptsFromStorage(receipts) {
    // Calculate total tips
    const totalTips = receipts.reduce((sum, receipt) => sum + (receipt.tip_amount || 0), 0);
    totalTipsElement.textContent = `$${totalTips.toFixed(2)}`;
    
    // Create a table to display the receipts
    createReceiptsFromStorage(receipts);
    
    // Initialize slideshow with the receipts
    initializeSlideshow(receipts);
}

// Initialize slideshow with receipt images
function initializeSlideshow(receipts) {
    // Store the receipts for the slideshow
    slideshowImages = receipts;
    
    // Reset the current slide index
    currentSlideIndex = 0;
    
    // Update the slideshow counter
    slideshowCounter.textContent = slideshowImages.length > 0 
        ? `1 / ${slideshowImages.length}` 
        : '0 / 0';
    
    // Enable/disable navigation buttons
    updateSlideshowNavButtons();
    
    // Display the first slide if there are images
    if (slideshowImages.length > 0) {
        displaySlide(currentSlideIndex);
    } else {
        // Show placeholder if no images
        slideshowImageContainer.innerHTML = `
            <div class="slideshow-placeholder">
                <p>No receipt images found. Try loading receipts again.</p>
            </div>
        `;
        
        // Reset receipt info
        receiptCustomer.textContent = 'N/A';
        receiptAmount.textContent = '$0.00';
        receiptTip.textContent = '$0.00';
    }
}

// Display a specific slide
function displaySlide(index) {
    if (slideshowImages.length === 0 || index < 0 || index >= slideshowImages.length) {
        return;
    }
    
    // Get the current receipt
    const receipt = slideshowImages[index];
    
    // Clear the image container
    slideshowImageContainer.innerHTML = '';
    
    // Add navigation arrows
    const prevArrow = document.createElement('button');
    prevArrow.className = 'slideshow-nav-arrow prev';
    prevArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevArrow.disabled = currentSlideIndex === 0;
    prevArrow.addEventListener('click', () => navigateSlideshow(-1));
    slideshowImageContainer.appendChild(prevArrow);
    
    const nextArrow = document.createElement('button');
    nextArrow.className = 'slideshow-nav-arrow next';
    nextArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextArrow.disabled = currentSlideIndex === slideshowImages.length - 1;
    nextArrow.addEventListener('click', () => navigateSlideshow(1));
    slideshowImageContainer.appendChild(nextArrow);
    
    // Log the image URL for debugging
    console.log('Displaying image with URL:', receipt.image_url);
    
    // Create and add the image element
    const img = document.createElement('img');
    img.className = 'slideshow-image';
    
    // Use the createPlaceholderElement function from receipt-placeholder.js
    
    // Check if this is a sample receipt (from our fallback data)
    if (receipt.is_sample) {
        // Use placeholder directly
        const placeholderText = `Receipt for ${receipt.customer_name}`;
        window.createPlaceholderElement(placeholderText, slideshowImageContainer);
        console.log('Using placeholder for:', receipt.customer_name);
        return; // Skip the rest of the function since we're not using an image
    } else if (receipt.image_url) {
        // For real URLs, try to use the image directly
        
        // Try the URL as is first
        img.src = receipt.image_url;
        console.log('Using original URL:', receipt.image_url);
        
        // Add the image to the container immediately
        slideshowImageContainer.appendChild(img);
        
        // Set up error handling
        img.alt = 'Receipt Image';
        img.onerror = function() {
            console.error('Image failed to load:', this.src);
            
            // Try with corrected URL if it's a Supabase URL
            if (this.src.includes('/receipts/') && !this.src.includes('/receipts_backup/')) {
                const correctedUrl = this.src.replace('/receipts/', '/receipts_backup/');
                console.log('Trying corrected URL:', correctedUrl);
                this.src = correctedUrl;
            } else {
                // If image still fails to load, show a placeholder with customer name
                const placeholderText = `Receipt for ${receipt.customer_name || 'Unknown'}`;
                window.createPlaceholderElement(placeholderText, slideshowImageContainer);
            }
        };
    } else {
        // Use a placeholder with customer name if no image URL
        const placeholderText = `Receipt for ${receipt.customer_name || 'Unknown'}`;
        window.createPlaceholderElement(placeholderText, slideshowImageContainer);
        console.log('Using placeholder for customer:', receipt.customer_name);
        return; // Skip the rest of the function since we're not using an image
    }
    slideshowImageContainer.appendChild(img);
    
    // Update receipt information
    receiptCustomer.textContent = receipt.customer_name || 'Unknown';
    receiptAmount.textContent = receipt.amount ? `$${receipt.amount.toFixed(2)}` : '$0.00';
    receiptTip.textContent = receipt.tip_amount ? `$${receipt.tip_amount.toFixed(2)}` : '$0.00';
    
    // Update tip amount input field
    tipAmountInput.value = receipt.tip_amount ? receipt.tip_amount.toFixed(2) : '';
    
    // Update the slideshow counter
    slideshowCounter.textContent = `${index + 1} / ${slideshowImages.length}`;
    
    // Update navigation buttons
    updateSlideshowNavButtons();
}

// Navigate through the slideshow
function navigateSlideshow(direction) {
    // Calculate the new index
    const newIndex = currentSlideIndex + direction;
    
    // Check if the new index is valid
    if (newIndex >= 0 && newIndex < slideshowImages.length) {
        currentSlideIndex = newIndex;
        displaySlide(currentSlideIndex);
    }
}

// Update the state of the slideshow navigation buttons
function updateSlideshowNavButtons() {
    // Disable the previous button if we're at the first slide
    prevSlideBtn.disabled = currentSlideIndex === 0;
    
    // Disable the next button if we're at the last slide
    nextSlideBtn.disabled = currentSlideIndex === slideshowImages.length - 1;
}

// Clear tip amount for the current receipt
async function clearTipAmount() {
    if (slideshowImages.length === 0 || currentSlideIndex < 0 || currentSlideIndex >= slideshowImages.length) {
        logWarning('No receipt selected to clear tip amount');
        return;
    }
    
    // Get the current receipt
    const receipt = slideshowImages[currentSlideIndex];
    
    // Check if there's a tip to clear
    if (!receipt.tip_amount || receipt.tip_amount === 0) {
        log('Tip amount is already zero or empty');
        return;
    }
    
    log(`Clearing tip amount for receipt: ${receipt.customer_name} from $${receipt.tip_amount.toFixed(2)} to $0.00`);
    
    try {
        // Create a unique key for this receipt in localStorage
        const receiptKey = `receipt_${receipt.bar_name}_${receipt.customer_name}_${receipt.amount}`.replace(/\s+/g, '_');
        
        // Get existing tip updates from localStorage
        let tipUpdates = {};
        const savedTipUpdates = localStorage.getItem('tipenter_tip_updates');
        if (savedTipUpdates) {
            tipUpdates = JSON.parse(savedTipUpdates);
            
            // Remove this receipt's tip from localStorage
            if (tipUpdates[receiptKey]) {
                delete tipUpdates[receiptKey];
                localStorage.setItem('tipenter_tip_updates', JSON.stringify(tipUpdates));
                log(`Removed tip amount from localStorage for key: ${receiptKey}`);
            }
        }
        
        // Update the receipt in the database
        if (receipt.receipt_id) {
            // If we have a receipt ID, update in the database
            const { error } = await supabaseClient
                .from('receipts_backup')
                .update({ tip_amount: 0 })
                .eq('id', receipt.receipt_id);
            
            if (error) {
                logWarning(`Database update failed, but tip is cleared locally: ${error.message}`);
            } else {
                log(`Successfully cleared tip amount in database for receipt ID: ${receipt.receipt_id}`);
                // Show database update notification
                showNotification('Tip amount cleared in database!', 'success');
            }
        } else {
            // Show local storage notification instead
            showNotification('Tip amount cleared locally!', 'success');
        }
        
        // Update the receipt in the local array
        receipt.tip_amount = 0;
        
        // Update the receipt tip display
        receiptTip.textContent = '$0.00';
        
        // Clear the tip amount input field
        tipAmountInput.value = '';
        
        // Update the total tips display
        const totalTips = slideshowImages.reduce((sum, r) => sum + (r.tip_amount || 0), 0);
        totalTipsElement.textContent = `$${totalTips.toFixed(2)}`;
        
        // Update the table display
        createReceiptsFromStorage(slideshowImages);
        
        log('Tip amount cleared successfully');
    } catch (error) {
        logError(`Error clearing tip amount: ${error.message}`);
    }
}

// Create a table to display the receipts from storage
function createReceiptsFromStorage(receipts) {
    // Create table container if it doesn't exist
    let tableContainer = document.getElementById('receipts-table-container');
    if (!tableContainer) {
        tableContainer = document.createElement('div');
        tableContainer.id = 'receipts-table-container';
        tableContainer.style.marginTop = '20px';
        document.querySelector('.container').appendChild(tableContainer);
    }
    
    // Clear existing content
    tableContainer.innerHTML = '';
    
    if (receipts.length === 0) {
        tableContainer.innerHTML = '<p>No receipts found in storage.</p>';
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '10px';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Bar Name', 'Customer', 'Amount (Subtotal)', 'Tip', 'Image'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.padding = '8px';
        th.style.textAlign = 'left';
        th.style.borderBottom = '2px solid #ddd';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    receipts.forEach(receipt => {
        const row = document.createElement('tr');
        
        // Add cells
        const barNameCell = document.createElement('td');
        barNameCell.textContent = receipt.bar_name || 'Unknown Bar';
        barNameCell.style.padding = '8px';
        barNameCell.style.borderBottom = '1px solid #ddd';
        row.appendChild(barNameCell);
        
        const customerCell = document.createElement('td');
        customerCell.textContent = receipt.customer_name || 'Unknown';
        customerCell.style.padding = '8px';
        customerCell.style.borderBottom = '1px solid #ddd';
        row.appendChild(customerCell);
        
        const amountCell = document.createElement('td');
        amountCell.textContent = receipt.amount ? `$${receipt.amount.toFixed(2)}` : '$0.00';
        amountCell.style.padding = '8px';
        amountCell.style.borderBottom = '1px solid #ddd';
        row.appendChild(amountCell);
        
        const tipCell = document.createElement('td');
        tipCell.textContent = receipt.tip_amount ? `$${receipt.tip_amount.toFixed(2)}` : '$0.00';
        tipCell.style.padding = '8px';
        tipCell.style.borderBottom = '1px solid #ddd';
        row.appendChild(tipCell);
        
        const imageCell = document.createElement('td');
        imageCell.style.padding = '8px';
        imageCell.style.borderBottom = '1px solid #ddd';
        
        // Add image thumbnail with link to slideshow
        if (receipt.image_url) {
            const img = document.createElement('img');
            img.src = receipt.image_url;
            img.alt = 'Receipt Image';
            img.style.width = '100px';
            img.style.height = 'auto';
            img.style.cursor = 'pointer';
            
            // Click to show in slideshow instead of opening in new tab
            img.onclick = () => {
                // Find the index of this receipt in the slideshowImages array
                const index = slideshowImages.findIndex(r => r.image_url === receipt.image_url);
                if (index !== -1) {
                    currentSlideIndex = index;
                    displaySlide(currentSlideIndex);
                    
                    // Scroll to the slideshow
                    slideshowContainer.scrollIntoView({ behavior: 'smooth' });
                }
            };
            
            imageCell.appendChild(img);
        } else {
            imageCell.textContent = 'No image';
        }
        
        row.appendChild(imageCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    log(`Displayed ${receipts.length} receipts in the table`);
}

// Create a table to display the receipts
function createReceiptsTable(receipts) {
    // Create table container if it doesn't exist
    let tableContainer = document.getElementById('receipts-table-container');
    if (!tableContainer) {
        tableContainer = document.createElement('div');
        tableContainer.id = 'receipts-table-container';
        tableContainer.style.marginTop = '20px';
        document.querySelector('.container').appendChild(tableContainer);
    }
    
    // Clear existing content
    tableContainer.innerHTML = '';
    
    if (receipts.length === 0) {
        tableContainer.innerHTML = '<p>No receipts found in the database.</p>';
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '10px';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Customer', 'Date', 'Amount', 'Tip', 'Status', 'Created At'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.padding = '8px';
        th.style.textAlign = 'left';
        th.style.borderBottom = '2px solid #ddd';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    receipts.forEach(receipt => {
        const row = document.createElement('tr');
        
        // Add cells
        const customerCell = document.createElement('td');
        customerCell.textContent = receipt.customer_name || 'Unknown';
        customerCell.style.padding = '8px';
        customerCell.style.borderBottom = '1px solid #ddd';
        row.appendChild(customerCell);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = receipt.date || 'N/A';
        dateCell.style.padding = '8px';
        dateCell.style.borderBottom = '1px solid #ddd';
        row.appendChild(dateCell);
        
        const amountCell = document.createElement('td');
        amountCell.textContent = receipt.amount ? `$${receipt.amount.toFixed(2)}` : '$0.00';
        amountCell.style.padding = '8px';
        amountCell.style.borderBottom = '1px solid #ddd';
        row.appendChild(amountCell);
        
        const tipCell = document.createElement('td');
        tipCell.textContent = receipt.tip_amount ? `$${receipt.tip_amount.toFixed(2)}` : '$0.00';
        tipCell.style.padding = '8px';
        tipCell.style.borderBottom = '1px solid #ddd';
        row.appendChild(tipCell);
        
        const statusCell = document.createElement('td');
        statusCell.textContent = receipt.status || 'pending';
        statusCell.style.padding = '8px';
        statusCell.style.borderBottom = '1px solid #ddd';
        // Add color based on status
        if (receipt.status === 'approved') {
            statusCell.style.color = '#40c057';
        } else if (receipt.status === 'rejected') {
            statusCell.style.color = '#fa5252';
        } else {
            statusCell.style.color = '#f59f00';
        }
        row.appendChild(statusCell);
        
        const createdAtCell = document.createElement('td');
        createdAtCell.textContent = receipt.created_at ? new Date(receipt.created_at).toLocaleString() : 'N/A';
        createdAtCell.style.padding = '8px';
        createdAtCell.style.borderBottom = '1px solid #ddd';
        row.appendChild(createdAtCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    log(`Displayed ${receipts.length} receipts in the table`);
}

// Test loading receipts from storage
async function testStorage() {
    try {
        log('Loading receipts from storage bin...');
        
        // Load saved tip updates from localStorage
        let tipUpdates = {};
        const savedTipUpdates = localStorage.getItem('tipenter_tip_updates');
        if (savedTipUpdates) {
            tipUpdates = JSON.parse(savedTipUpdates);
            log(`Loaded ${Object.keys(tipUpdates).length} saved tip updates from localStorage`);
        }
        
        // Try different bucket names
        const bucketNames = ['receipts_backup', 'receipts', 'tipenter-receipts'];
        let files = [];
        let usedBucket = '';
        
        // Try each bucket until we find one with files
        for (const bucketName of bucketNames) {
            try {
                log(`Trying bucket: ${bucketName}`);
                const { data: bucketFiles, error: listError } = await supabaseClient
                    .storage
                    .from(bucketName)
                    .list();
                
                if (!listError && bucketFiles && bucketFiles.length > 0) {
                    files = bucketFiles;
                    usedBucket = bucketName;
                    log(`Found ${files.length} files in ${bucketName} bucket`);
                    break;
                }
            } catch (e) {
                log(`Error accessing bucket ${bucketName}: ${e.message}`);
            }
        }
        
        if (files.length === 0) {
            // If we couldn't find any files in the buckets, create some sample data
            log('No files found in storage buckets. Creating sample data...');
            
            // Example filename from user
            const sampleFilenames = [
                'receipt_Cork_Harbour_PubDate_31825_841_pmACCT_Acct__CustomerCustomer_DAYUN_LEEServer_AmountAmount_1763TIP300300TOTAL_1_6BE26EBA.jpg',
                'receipt_Tipenter_Bar_CustomerCustomer_SEAN_HORGANServer_AmountAmount_4408TIP4408TOTAL_1_9690B3CD.jpg',
                'receipt_Downtown_Pub_CustomerCustomer_JOHN_DOEServer_AmountAmount_2550TIP500TOTAL_1_8765ABCD.jpg'
            ];
            
            const processedReceipts = sampleFilenames.map((filename, index) => {
                // Parse receipt information from filename
                let customerName = 'Unknown';
                let amount = 0;
                let tipAmount = 0;
                let barName = 'Unknown Bar';
                
                // Extract bar name
                const barNameMatch = filename.match(/receipt_([^_]+)_([^_]+)/);
                if (barNameMatch) {
                    barName = `${barNameMatch[1]} ${barNameMatch[2]}`.replace(/_/g, ' ');
                }
                
                // Try to extract customer name
                const customerIndex = filename.indexOf('Customer');
                if (customerIndex !== -1) {
                    const customerEndIndex = filename.indexOf('Server', customerIndex);
                    if (customerEndIndex !== -1) {
                        customerName = filename.substring(customerIndex + 8, customerEndIndex).replace(/_/g, ' ').trim();
                    }
                }
                
                // Try to extract amount
                const amountIndex = filename.indexOf('Amount');
                if (amountIndex !== -1) {
                    const amountEndIndex = filename.indexOf('TIP', amountIndex);
                    if (amountEndIndex !== -1) {
                        const amountStr = filename.substring(amountIndex + 6, amountEndIndex);
                        amount = parseFloat(amountStr) / 100; // Assuming amount is in cents
                    }
                }
                
                // Try to extract tip
                const tipIndex = filename.indexOf('TIP');
                if (tipIndex !== -1) {
                    const tipEndIndex = filename.indexOf('TOTAL', tipIndex);
                    if (tipEndIndex !== -1) {
                        const tipStr = filename.substring(tipIndex + 3, tipEndIndex);
                        tipAmount = parseFloat(tipStr) / 100; // Assuming tip is in cents
                    }
                }
                
                // Create a direct URL to a sample image
                const sampleImageUrl = `https://via.placeholder.com/800x600.jpg?text=Receipt+${index+1}`;
                
                return {
                    customer_name: customerName,
                    bar_name: barName,
                    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                    amount: amount,
                    tip_amount: tipAmount,
                    image_url: sampleImageUrl,
                    filename: filename,
                    is_sample: true // Flag to indicate this is sample data
                };
            });
            
            log(`Created ${processedReceipts.length} sample receipts`);
            
            // Display the receipts
            displayReceiptsFromStorage(processedReceipts);
            
            return processedReceipts;
        }
        
        // Filter for image files
        const imageFiles = files.filter(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
        });
        
        log(`Found ${imageFiles.length} image files`);
        
        // Process each image file
        const processedReceipts = [];
        
        for (const file of imageFiles) {
            log(`Processing file: ${file.name}`);
            
            // Extract file name parts (assuming format: receipt_[details].jpg)
            const fileNameParts = file.name.split('_');
            if (fileNameParts.length < 2) {
                logWarning(`Skipping file with invalid name format: ${file.name}`);
                continue;
            }
            
            // Parse receipt information from filename
            let customerName = 'Unknown';
            let amount = 0;
            let tipAmount = 0;
            let barName = 'Unknown Bar';
            
            // Extract bar name
            if (fileNameParts.length > 2) {
                barName = `${fileNameParts[1]} ${fileNameParts[2]}`.replace(/_/g, ' ');
            }
            
            // Try to extract customer name
            const customerIndex = file.name.indexOf('Customer');
            if (customerIndex !== -1) {
                const customerEndIndex = file.name.indexOf('Server', customerIndex);
                if (customerEndIndex !== -1) {
                    customerName = file.name.substring(customerIndex + 8, customerEndIndex).replace(/_/g, ' ').trim();
                }
            }
            
            // Try to extract amount
            const amountIndex = file.name.indexOf('Amount');
            if (amountIndex !== -1) {
                const amountEndIndex = file.name.indexOf('TIP', amountIndex);
                if (amountEndIndex !== -1) {
                    const amountStr = file.name.substring(amountIndex + 6, amountEndIndex);
                    amount = parseFloat(amountStr) / 100; // Assuming amount is in cents
                }
            }
            
            // Try to extract tip
            const tipIndex = file.name.indexOf('TIP');
            if (tipIndex !== -1) {
                const tipEndIndex = file.name.indexOf('TOTAL', tipIndex);
                if (tipEndIndex !== -1) {
                    const tipStr = file.name.substring(tipIndex + 3, tipEndIndex);
                    tipAmount = parseFloat(tipStr) / 100; // Assuming tip is in cents
                }
            }
            
            log(`Extracted info - Customer: ${customerName}, Amount: $${amount.toFixed(2)}, Tip: $${tipAmount.toFixed(2)}`);
            
            // Get public URL for the image
            const { data: publicUrlData } = supabaseClient
                .storage
                .from(usedBucket)
                .getPublicUrl(file.name);
            
            const publicUrl = publicUrlData.publicUrl;
            log(`Public URL: ${publicUrl}`);
            
            // Create a receipt object (but don't insert into database due to RLS issues)
            const receiptData = {
                customer_name: customerName,
                bar_name: barName,
                date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                amount: amount,
                tip_amount: tipAmount,
                image_url: publicUrl,
                filename: file.name // Store the original filename
            };
            
            // Check if we have a saved tip update for this receipt
            const receiptKey = `receipt_${barName}_${customerName}_${amount}`.replace(/\s+/g, '_');
            if (tipUpdates[receiptKey]) {
                receiptData.tip_amount = tipUpdates[receiptKey];
                log(`Applied saved tip amount of $${tipUpdates[receiptKey].toFixed(2)} to receipt: ${customerName}`);
            }
            
            // Add to processed receipts array
            processedReceipts.push(receiptData);
            
            log(`Analyzed receipt from storage: ${file.name}`);
        }
        
        log(`Processed ${processedReceipts.length} receipts from storage`);
        
        // Apply limit filter
        const limit = parseInt(limitFilterSelect.value, 10);
        const limitedReceipts = processedReceipts.slice(0, limit);
        
        // Display the receipts
        displayReceiptsFromStorage(limitedReceipts);
        
        return limitedReceipts;
    } catch (error) {
        logError(`Error loading receipts from storage: ${error.message}`);
        throw error;
    }
}

// Logging functions
function log(message) {
    console.log(message);
    appendToLog(message);
}

function logError(message) {
    console.error(message);
    appendToLog(message, 'error');
}

function logWarning(message) {
    console.warn(message);
    appendToLog(message, 'warning');
}

function appendToLog(message, type = 'info') {
    if (!logContainer) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Show notification for database updates
function showNotification(message, type = 'success') {
    if (!dbNotification) return;
    
    // Set the notification message
    dbNotification.textContent = message;
    
    // Set the notification type
    dbNotification.className = 'db-notification';
    dbNotification.classList.add(type);
    
    // Show the notification
    dbNotification.classList.add('show');
    
    // Hide the notification after 3 seconds
    setTimeout(() => {
        dbNotification.classList.remove('show');
    }, 3000);
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initTest);
