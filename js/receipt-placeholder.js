/**
 * Receipt Placeholder Utility
 * Provides functions to create placeholder elements for receipt images
 */

// Create a placeholder element for receipt images
function createPlaceholderElement(text, container) {
    // Clear the container
    if (container) {
        container.innerHTML = '';
    }
    
    // Create a div for the placeholder
    const placeholder = document.createElement('div');
    placeholder.style.width = '100%';
    placeholder.style.height = '100%';
    placeholder.style.backgroundColor = '#f0f0f0';
    placeholder.style.border = '5px solid #999999';
    placeholder.style.display = 'flex';
    placeholder.style.justifyContent = 'center';
    placeholder.style.alignItems = 'center';
    placeholder.style.textAlign = 'center';
    placeholder.style.padding = '20px';
    placeholder.style.boxSizing = 'border-box';
    
    // Create text element
    const textElement = document.createElement('p');
    textElement.textContent = text;
    textElement.style.color = '#333333';
    textElement.style.fontSize = '18px';
    textElement.style.fontWeight = 'bold';
    textElement.style.margin = '0';
    
    // Add text to placeholder
    placeholder.appendChild(textElement);
    
    // Add placeholder to container if provided
    if (container) {
        container.appendChild(placeholder);
    }
    
    return placeholder;
}

// Create receipt image or placeholder
function createReceiptImageOrPlaceholder(receipt, container) {
    if (!receipt.image_url) {
        const placeholder = createPlaceholderElement(`No Receipt Image Available\nCustomer: ${receipt.customer_name || 'Unknown'}`, container);
        return placeholder;
    }
    
    // Create image element
    const img = document.createElement('img');
    img.src = receipt.image_url;
    img.alt = 'Receipt Image';
    img.className = 'receipt-image-full';
    
    // Add error handling
    img.onerror = function() {
        this.onerror = null;
        this.style.display = 'none';
        createPlaceholderElement(`Image Not Found\nCustomer: ${receipt.customer_name || 'Unknown'}`, container);
    };
    
    // Add to container if provided
    if (container) {
        container.innerHTML = '';
        container.appendChild(img);
    }
    
    return img;
}

// Fix receipt images on the page
function fixReceiptImages() {
    // Fix receipt image in modal
    const receiptImage = document.getElementById('receipt-image');
    if (receiptImage) {
        receiptImage.onerror = function() {
            const container = this.parentElement;
            this.style.display = 'none';
            
            // Create placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'receipt-placeholder';
            placeholder.style.width = '100%';
            placeholder.style.height = '100%';
            placeholder.style.backgroundColor = '#f0f0f0';
            placeholder.style.border = '5px solid #999999';
            placeholder.style.display = 'flex';
            placeholder.style.justifyContent = 'center';
            placeholder.style.alignItems = 'center';
            placeholder.style.textAlign = 'center';
            placeholder.style.padding = '20px';
            placeholder.style.boxSizing = 'border-box';
            
            // Create text element
            const textElement = document.createElement('p');
            textElement.textContent = 'Image Not Found';
            textElement.style.color = '#333333';
            textElement.style.fontSize = '18px';
            textElement.style.fontWeight = 'bold';
            textElement.style.margin = '0';
            
            // Add text to placeholder
            placeholder.appendChild(textElement);
            
            // Add placeholder to container
            container.appendChild(placeholder);
        };
    }
    
    // Fix receipt thumbnails
    document.querySelectorAll('.receipt-thumbnail').forEach(img => {
        img.onerror = function() {
            this.onerror = null;
            this.style.display = 'none';
            
            const container = this.parentElement;
            
            // Create placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'receipt-thumbnail-placeholder';
            placeholder.style.width = '60px';
            placeholder.style.height = '60px';
            placeholder.style.backgroundColor = '#f0f0f0';
            placeholder.style.border = '2px solid #999999';
            placeholder.style.display = 'flex';
            placeholder.style.justifyContent = 'center';
            placeholder.style.alignItems = 'center';
            placeholder.style.textAlign = 'center';
            
            // Create text element
            const textElement = document.createElement('p');
            textElement.textContent = 'No Image';
            textElement.style.color = '#333333';
            textElement.style.fontSize = '10px';
            textElement.style.fontWeight = 'bold';
            textElement.style.margin = '0';
            
            // Add text to placeholder
            placeholder.appendChild(textElement);
            
            // Add placeholder to container
            container.appendChild(placeholder);
        };
    });
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', fixReceiptImages);

// Export functions
window.createPlaceholderElement = createPlaceholderElement;
window.createReceiptImageOrPlaceholder = createReceiptImageOrPlaceholder;
window.fixReceiptImages = fixReceiptImages;
