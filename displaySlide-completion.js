// Display a specific slide
function displaySlide(index) {
    if (slideshowImages.length === 0 || index < 0 || index >= slideshowImages.length) {
        return;
    }
    
    // Get the current receipt
    const receipt = slideshowImages[index];
    
    // Clear the image container
    slideshowImageContainer.innerHTML = '';
    
    // Add approval status indicator
    const approvalIndicator = document.createElement('div');
    approvalIndicator.className = 'approval-indicator';
    approvalIndicator.style.position = 'absolute';
    approvalIndicator.style.top = '10px';
    approvalIndicator.style.right = '10px';
    approvalIndicator.style.zIndex = '10';
    approvalIndicator.style.fontSize = '24px';
    approvalIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    approvalIndicator.style.padding = '5px';
    approvalIndicator.style.borderRadius = '50%';
    
    if (receipt.approval_status === 'approved') {
        // Green checkmark for approved receipts
        approvalIndicator.innerHTML = '<i class="fas fa-check-circle approved-icon"></i>';
        approvalIndicator.title = 'Approved by ' + (receipt.approved_by || 'super admin');
    } else {
        // Red X for non-approved receipts
        approvalIndicator.innerHTML = '<i class="fas fa-times-circle rejected-icon"></i>';
        approvalIndicator.title = 'Not approved';
        console.log('Showing red X');
    }
    
    slideshowImageContainer.appendChild(approvalIndicator);
    
    // Add navigation arrows with fixed positioning
    const prevArrow = document.createElement('button');
    prevArrow.className = 'slideshow-nav-arrow prev';
    prevArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevArrow.disabled = currentSlideIndex === 0;
    prevArrow.addEventListener('click', () => navigateSlideshow(-1));
    prevArrow.style.position = 'absolute';
    prevArrow.style.top = '50%';
    prevArrow.style.transform = 'translateY(-50%)';
    prevArrow.style.left = '10px';
    prevArrow.style.zIndex = '20';
    slideshowImageContainer.appendChild(prevArrow);
    
    const nextArrow = document.createElement('button');
    nextArrow.className = 'slideshow-nav-arrow next';
    nextArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextArrow.disabled = currentSlideIndex === slideshowImages.length - 1;
    nextArrow.addEventListener('click', () => navigateSlideshow(1));
    nextArrow.style.position = 'absolute';
    nextArrow.style.top = '50%';
    nextArrow.style.transform = 'translateY(-50%)';
    nextArrow.style.right = '10px';
    nextArrow.style.zIndex = '20';
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
        // Construct a unique URL for each receipt based on its ID or other unique properties
        let imageUrl;
        
        if (receipt.receipt_id) {
            // If we have a receipt ID, use it to construct a unique URL
            imageUrl = `https://gmysjdndtqwkjvrngnze.supabase.co/storage/v1/object/public/receipts//receipt_1_${receipt.receipt_id}.jpg`;
        } else if (receipt.image_url) {
            // If the receipt has an image_url property, use that
            imageUrl = receipt.image_url;
        } else {
            // Fallback to the known working URL as a last resort
            imageUrl = 'https://gmysjdndtqwkjvrngnze.supabase.co/storage/v1/object/public/receipts//receipt_1_17EE6CA7-DD7F-4795-A8C7-7C9999869652.jpg';
        }
        
        console.log('Using image URL:', imageUrl);
        img.src = imageUrl;
        
        // Add the image to the container (only once)
        // Note: We'll append the image at the end of the function
        
        // Set up error handling as fallback
        img.alt = 'Receipt Image';
        img.onerror = function() {
            console.error('Placeholder image failed to load:', this.src);
            // If even the placeholder fails, use the text placeholder
            const placeholderText = `Receipt for ${receipt.customer_name || 'Unknown'}`;
            slideshowImageContainer.removeChild(this); // Remove the failed image
            window.createPlaceholderElement(placeholderText, slideshowImageContainer);
            console.log('Using text placeholder after image load failure');
        };
    } else {
        // Use a placeholder with customer name if no image URL
        const placeholderText = `Receipt for ${receipt.customer_name || 'Unknown'}`;
        window.createPlaceholderElement(placeholderText, slideshowImageContainer);
        console.log('Using placeholder for customer:', receipt.customer_name);
        return; // Skip the rest of the function since we're not using an image
    }
    // Add the image to the container (only once, here at the end)
    slideshowImageContainer.appendChild(img);
    
    // Make sure the image is properly styled for scrolling
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    
    // Update receipt information
    receiptCustomer.textContent = receipt.customer_name || 'Unknown';
    receiptAmount.textContent = receipt.amount ? `$${receipt.amount.toFixed(2)}` : '$0.00';
    receiptTip.textContent = receipt.tip_amount ? `$${receipt.tip_amount.toFixed(2)}` : '$0.00';
    
    // Update tip amount input field
    tipAmountInput.value = receipt.tip_amount ? receipt.tip_amount.toFixed(2) : '';
    
    // Update the slideshow counter
    slideshowCounter.textContent = `${index + 1} / ${slideshowImages.length}`;
    
    // Always update the created_at display
    if (receipt.created_at) {
        const formattedDate = new Date(receipt.created_at).toLocaleString();
        createdAtDisplay.textContent = formattedDate;
    } else {
        createdAtDisplay.textContent = 'Not available';
    }
    
    // Update navigation buttons
    updateSlideshowNavButtons();
    
    // Hide the Claude tip section by default
    if (claudeTipSection) {
        claudeTipSection.style.display = 'none';
    }
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
    
    ['Status', 'Bar Name', 'Customer', 'Amount (Subtotal)', 'Tip', 'Image'].forEach(text => {
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
        
        // Add status cell with approval indicator
        const statusCell = document.createElement('td');
        statusCell.style.padding = '8px';
        statusCell.style.borderBottom = '1px solid #ddd';
        statusCell.style.textAlign = 'center';
        
        if (receipt.approval_status === 'approved') {
            const approvalIcon = document.createElement('i');
            approvalIcon.className = 'fas fa-check-circle approved-icon';
            approvalIcon.style.fontSize = '18px';
            statusCell.appendChild(approvalIcon);
            
            // Add tooltip with approval info
            statusCell.title = `Approved by ${receipt.approved_by || 'admin'} on ${new Date(receipt.approved_at || Date.now()).toLocaleString()}`;
        } else if (receipt.approval_status === 'rejected') {
            const rejectedIcon = document.createElement('i');
            rejectedIcon.className = 'fas fa-times-circle rejected-icon';
            rejectedIcon.style.fontSize = '18px';
            statusCell.appendChild(rejectedIcon);
        } else {
            const pendingIcon = document.createElement('i');
            pendingIcon.className = 'fas fa-clock pending-icon';
            pendingIcon.style.fontSize = '18px';
            statusCell.appendChild(pendingIcon);
        }
        
        row.appendChild(statusCell);
        
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
            
            // Construct a unique URL for each receipt thumbnail
            let thumbnailUrl;
            
            if (receipt.receipt_id) {
                // If we have a receipt ID, use it to construct a unique URL
                thumbnailUrl = `https://gmysjdndtqwkjvrngnze.supabase.co/storage/v1/object/public/receipts//receipt_1_${receipt.receipt_id}.jpg`;
            } else if (receipt.image_url) {
                // If the receipt has an image_url property, use that
                thumbnailUrl = receipt.image_url;
            } else {
                // Fallback to a URL based on customer name as a last resort
                thumbnailUrl = `https://gmysjdndtqwkjvrngnze.supabase.co/storage/v1/object/public/receipts//receipt_1_${receipt.customer_name.replace(/\s+/g, '_')}.jpg`;
            }
            
            console.log('Using thumbnail URL:', thumbnailUrl);
            img.src = thumbnailUrl;
            img.alt = 'Receipt Image';
            img.style.width = '100px';
            img.style.height = 'auto';
            img.style.cursor = 'pointer';
            
            // Add error handling for the thumbnail
            img.onerror = function() {
                // If image fails to load, show text instead
                imageCell.textContent = 'Image unavailable';
            };
            
            // Click to show in slideshow instead of opening in new tab
            img.onclick = () => {
                // Find the index of this receipt in the slideshowImages array
                const index = slideshowImages.findIndex(r => r.receipt_id === receipt.receipt_id);
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

// Test storage functionality
async function testStorage() {
    try {
        log('Testing storage functionality...');
        
        // Create sample receipts
        const sampleReceipts = [
            {
                customer_name: 'John Doe',
                bar_name: 'Cork Harbour Pub',
                amount: 25.50,
                tip_amount: 5.00,
                created_at: new Date().toISOString(),
                is_sample: true
            },
            {
                customer_name: 'Jane Smith',
                bar_name: 'Tipenter Bar',
                amount: 44.08,
                tip_amount: 8.82,
                created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                is_sample: true
            },
            {
                customer_name: 'Bob Johnson',
                bar_name: 'Downtown Pub',
                amount: 32.75,
                tip_amount: 6.55,
                created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                is_sample: true
            }
        ];
        
        log(`Created ${sampleReceipts.length} sample receipts`);
        
        // Display the receipts
        displayReceiptsFromStorage(sampleReceipts);
        
        return sampleReceipts;
    } catch (error) {
        logError(`Error testing storage: ${error.message}`);
        throw error;
    }
}

// Logging functions
function log(message, type = 'info') {
    console.log(message);
    appendToLog(message, type);
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

// Send a single receipt to Claude AI for rendering
async function sendToAiForRendering(receipt) {
    if (!receipt) {
        // If no receipt is provided, use the current one from the slideshow
        if (slideshowImages.length === 0 || currentSlideIndex < 0 || currentSlideIndex >= slideshowImages.length) {
            logWarning('No receipt selected to send to AI');
            return null;
        }
        receipt = slideshowImages[currentSlideIndex];
    }
    
    log(`Sending receipt for ${receipt.customer_name} to Claude AI for rendering...`);
    
    // Declare result variable in outer scope so it's accessible in finally block
    let result;
    
    try {
        // Disable the button to prevent multiple clicks if this is a single receipt process
        if (!receipt || receipt === slideshowImages[currentSlideIndex]) {
            sendToAiBtn.disabled = true;
            sendToAiBtn.textContent = 'Sending to AI...';
        }
        
        // Construct a unique URL for the current receipt
        let imageUrl;
        
        if (receipt.receipt_id) {
            // If we have a receipt ID, use it to construct a unique URL
            imageUrl = `https://gmysjdndtqwkjvrngnze.supabase.co/storage/v1/object/public/receipts//receipt_1_${receipt.receipt_id}.jpg`;
        } else if (receipt.image_url) {
            // If the receipt has an image_url property, use that
            imageUrl = receipt.image_url;
        } else {
            // Fallback to the known working URL as a last resort
            imageUrl = 'https://gmysjdndtqwkjvrngnze.supabase.co/storage/v1/object/public/receipts//receipt_1_17EE6CA7-DD7F-4795-A8C7-7C9999869652.jpg';
        }
        
        log(`Using image URL for AI processing: ${imageUrl}`);
        
        // Convert image to base64 (this is a simplified approach)
        // In a real implementation, you might want to use a more robust method
        const getBase64FromImageUrl = async (url) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('Error converting image to base64:', error);
                throw error;
            }
        };
        
        // Get base64 data from the image
        const base64Image = await getBase64FromImageUrl(imageUrl);
        
        log('Sending image to Claude API...');
        
        // Prepare the request to the server proxy
        const response = await fetch('/api/process-receipt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64Image,
                filename: `receipt_${receipt.receipt_id || 'unknown'}.jpg`
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
        }
        
        // Parse the response
        result = await response.json();
        
        // Log the response
        log('Received response from Claude AI:');
        log(JSON.stringify(result.result, null, 2));
        
        // Log the cost information if available
        if (result.cost_info) {
            log('Cost Information:');
            log(`Estimated Input Tokens: ${result.cost_info.estimated_input_tokens.toLocaleString()}`);
            log(`Estimated Output Tokens: ${result.cost_info.estimated_output_tokens.toLocaleString()}`);
            log(`Estimated Cost: $${result.cost_info.estimated_cost_usd}`);
            log(`Note: ${result.cost_info.disclaimer}`);
        }
        
        // Show success notification
        showNotification('Receipt successfully processed by AI!', 'success');
        
        // If the API returned a tip amount, update the Claude tip section
        if (result.result && result.result.tip) {
            const tipAmount = parseFloat(result.result.tip.replace(/[^0-9.]/g, ''));
            if (!isNaN(tipAmount) && tipAmount > 0) {
                // Show the Claude tip section
                if (claudeTipSection) {
                    claudeTipSection.style.display = 'block';
                    claudeTipAmount.textContent = `$${tipAmount.toFixed(2)}`;
                }
                
                // Also update the input field for convenience
                tipAmountInput.value = tipAmount.toFixed(2);
                
                log(`AI suggested tip amount: ${result.result.tip}`);
            } else {
                // If no tip or zero tip, suggest 20% of subtotal
                const subtotal = parseFloat(result.result.amount?.replace(/[^0-9.]/g, '') || '0');
                if (!isNaN(subtotal) && subtotal > 0) {
                    const suggestedTip = subtotal * 0.2;
                    
                    // Show the Claude tip section
                    if (claudeTipSection) {
                        claudeTipSection.style.display = 'block';
                        claudeTipAmount.textContent = `$${suggestedTip.toFixed(2)}`;
                    }
                    
                    // Also update the input field for convenience
                    tipAmountInput.value = suggestedTip.toFixed(2);
                    
                    log(`AI suggested tip amount (20% of subtotal): $${suggestedTip.toFixed(2)}`);
                }
            }
        }
        
    } catch (error) {
        logError(`Error sending to AI: ${error.message}`);
    } finally {
        // Always re-enable the button
        sendToAiBtn.disabled = false;
        sendToAiBtn.textContent = 'Send to AI to Render';
        
        // Return the result for batch processing
        return result;
    }
}

// Update receipt date
async function updateReceiptDate() {
    if (slideshowImages.length === 0 || currentSlideIndex < 0 || currentSlideIndex >= slideshowImages.length) {
        logWarning('No receipt selected to update date');
        return;
    }
    
    // Get the current receipt
    const receipt = slideshowImages[currentSlideIndex];
    
    // Get the new date from the date filter input
    const newDate = dateFilterInput.value;
    
    if (!newDate) {
        logError('Please select a date first');
        return;
    }
    
    // Create a new Date object from the input value (which is in YYYY-MM-DD format)
    const newDateObj = new Date(newDate);
    
    // Preserve the time from the original date if it exists
    let newDateTime = newDateObj;
    if (receipt.created_at) {
        const oldDate = new Date(receipt.created_at);
        newDateTime = new Date(
            newDateObj.getFullYear(),
            newDateObj.getMonth(),
            newDateObj.getDate(),
            oldDate.getHours(),
            oldDate.getMinutes(),
            oldDate.getSeconds()
        );
    }
    
    // Format as ISO string for database
    const newDateTimeISO = newDateTime.toISOString();
    
    log(`Updating date for receipt: ${receipt.customer_name} from ${receipt.created_at || 'unknown'} to ${newDateTimeISO}`);
    
    try {
        // Update the receipt in the database if we have a receipt_id
        if (receipt.receipt_id) {
            const { error } = await supabaseClient
                .from('receipts_backup')
                .update({ 
                    created_at: newDateTimeISO
                })
                .eq('id', receipt.receipt_id);
            
            if (error) {
                logError(`Database update failed: ${error.message}`);
                return;
            }
            
            log(`Successfully updated date in database for receipt ID: ${receipt.receipt_id}`);
            
            // Show database update notification
            showNotification('Date updated successfully!', 'success');
            
            // Update the receipt in our local array
            receipt.created_at = newDateTimeISO;
            
            // Update the created_at display
            const formattedDate = new Date(newDateTimeISO).toLocaleString();
            createdAtDisplay.textContent = formattedDate;
            
            // Refresh the current slide
            displaySlide(currentSlideIndex);
            
            // Update the table display
            createReceiptsFromStorage(slideshowImages);
        } else {
            logWarning('Cannot update date for sample receipts');
            showNotification('Cannot update date for sample receipts', 'error');
        }
    } catch (error) {
        logError(`Error updating date: ${error.message}`);
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initTest);
