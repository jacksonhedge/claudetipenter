/**
 * Service for handling data export operations
 */
import { tableToCSV } from '../utils/dataUtils.js';
import { showNotification } from '../utils/uiUtils.js';

/**
 * Export table data to CSV file
 * @param {HTMLTableElement} table - The table element to export
 * @param {string} fileName - The name of the file to download
 */
export function exportTableToCsv(table, fileName = 'receipt_data.csv') {
    try {
        if (!table) {
            throw new Error('No table element provided');
        }
        
        // Convert table to CSV
        const csvContent = tableToCSV(table);
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('CSV file exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showNotification('Failed to export CSV file', 'error');
    }
}

/**
 * Export JSON data to file
 * @param {Object} data - The data to export
 * @param {string} fileName - The name of the file to download
 */
export function exportToJson(data, fileName = 'receipt_data.json') {
    try {
        if (!data) {
            throw new Error('No data provided');
        }
        
        // Convert to JSON string
        const jsonString = JSON.stringify(data, null, 2);
        
        // Create download link
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('JSON file exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting JSON:', error);
        showNotification('Failed to export JSON file', 'error');
    }
}

/**
 * Copy JSON data to clipboard
 * @param {Object|string} data - The data to copy (object or JSON string)
 * @param {Function} onSuccess - Callback function on successful copy
 * @param {Function} onError - Callback function on error
 */
export function copyJsonToClipboard(data, onSuccess, onError) {
    try {
        // Convert to string if it's an object
        const jsonText = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
        
        navigator.clipboard.writeText(jsonText)
            .then(() => {
                showNotification('JSON copied to clipboard', 'success');
                if (onSuccess) onSuccess();
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                showNotification('Failed to copy to clipboard', 'error');
                if (onError) onError(err);
            });
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showNotification('Failed to copy to clipboard', 'error');
        if (onError) onError(error);
    }
}

/**
 * Generate a PDF report from the results
 * @param {Object} data - The data to include in the report
 * @param {string} fileName - The name of the file to download
 */
export function generatePdfReport(data, fileName = 'receipt_report.pdf') {
    try {
        const { jsPDF } = window.jspdf;
        
        // Create new PDF document
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text('Receipt Processing Report', 20, 20);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        
        // Add summary
        doc.setFontSize(14);
        doc.text('Summary', 20, 40);
        doc.setFontSize(12);
        doc.text(`Total Receipts: ${data.results ? data.results.length : 0}`, 20, 50);
        
        // Add table of results
        let yPos = 70;
        doc.setFontSize(14);
        doc.text('Receipt Details', 20, yPos);
        yPos += 10;
        
        // Table headers
        doc.setFontSize(12);
        doc.text('Customer', 20, yPos);
        doc.text('Time', 80, yPos);
        doc.text('Amount', 120, yPos);
        doc.text('Tip', 160, yPos);
        yPos += 10;
        
        // Table rows
        if (data.results) {
            data.results.forEach(item => {
                // Check if we need a new page
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.text(item.customer_name || 'N/A', 20, yPos);
                doc.text(item.time || 'N/A', 80, yPos);
                doc.text(item.amount || 'N/A', 120, yPos);
                doc.text(item.tip || 'N/A', 160, yPos);
                yPos += 10;
            });
        }
        
        // Save the PDF
        doc.save(fileName);
        
        showNotification('PDF report generated successfully', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Failed to generate PDF report', 'error');
    }
}

/**
 * Generate a PDF with images from the grid
 * @param {Array} images - Array of image data objects
 * @param {string} fileName - The name of the file to download
 * @param {Object} options - PDF generation options
 * @param {string} options.orientation - Page orientation ('portrait' or 'landscape')
 * @param {string} options.format - Page format ('a4', 'letter', etc.)
 * @param {number} options.imageQuality - Image quality (0-1)
 */
export function generateImagesPdf(images, fileName = 'receipt_images.pdf', options = {}) {
    try {
        if (!images || images.length === 0) {
            showNotification('No images to export', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        
        // Default options
        const defaultOptions = {
            orientation: 'portrait',
            format: 'a4',
            imageQuality: 0.8
        };
        
        // Merge default options with provided options
        const pdfOptions = { ...defaultOptions, ...options };
        
        // Create new PDF document
        const doc = new jsPDF({
            orientation: pdfOptions.orientation,
            unit: 'mm',
            format: pdfOptions.format
        });
        
        // PDF dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        
        // Split the page into two halves
        const leftHalfWidth = pageWidth / 2 - margin;
        const rightHalfWidth = pageWidth / 2 - margin;
        
        // Full content height (minus margins)
        const contentHeight = pageHeight - (margin * 2);
        
        // Add title to first page only
        doc.setFontSize(18);
        doc.text('Receipt Images', margin, margin + 10);
        
        // Add date to first page only
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, margin + 20);
        
        // Add summary to first page only
        doc.text(`Total Images: ${images.length}`, margin, margin + 30);
        
        // Process each image
        let currentPage = 1;
        const processImage = (index) => {
            if (index >= images.length) {
                // All images processed, save the PDF
                doc.save(fileName);
                showNotification('PDF with images generated successfully', 'success');
                return;
            }
            
            const image = images[index];
            
            // Add a new page for each image (except the first one)
            if (index > 0) {
                doc.addPage();
                currentPage++;
            }
            
            // Starting position for text (left half)
            const textX = margin;
            let textY = margin + (currentPage === 1 ? 50 : 20); // Account for title on first page
            
            // Add page number
            doc.setFontSize(10);
            doc.text(`Page ${currentPage} of ${images.length}`, pageWidth - margin - 40, pageHeight - margin);
            
            // Add image info section header
            doc.setFontSize(14);
            doc.text(`Receipt ${index + 1} of ${images.length}`, textX, textY);
            textY += 10;
            
            // Add dividing line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(textX, textY, textX + leftHalfWidth - 10, textY);
            textY += 10;
            
            // Add customer name
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Customer:`, textX, textY);
            doc.setFont(undefined, 'bold');
            doc.text(`${image.customer_name || 'N/A'}`, textX + 30, textY);
            doc.setFont(undefined, 'normal');
            textY += 10;
            
            // Add date and time
            doc.text(`Date:`, textX, textY);
            doc.setFont(undefined, 'bold');
            doc.text(`${image.date || 'N/A'}`, textX + 30, textY);
            doc.setFont(undefined, 'normal');
            textY += 10;
            
            doc.text(`Time:`, textX, textY);
            doc.setFont(undefined, 'bold');
            doc.text(`${image.time || 'N/A'}`, textX + 30, textY);
            doc.setFont(undefined, 'normal');
            textY += 10;
            
            // Add amount info
            doc.text(`Amount:`, textX, textY);
            doc.setFont(undefined, 'bold');
            doc.text(`${image.amount || 'N/A'}`, textX + 30, textY);
            doc.setFont(undefined, 'normal');
            textY += 10;
            
            doc.text(`Tip:`, textX, textY);
            doc.setFont(undefined, 'bold');
            doc.text(`${image.tip || 'N/A'}`, textX + 30, textY);
            doc.setFont(undefined, 'normal');
            textY += 10;
            
            doc.text(`Total:`, textX, textY);
            doc.setFont(undefined, 'bold');
            doc.text(`${image.total || 'N/A'}`, textX + 30, textY);
            doc.setFont(undefined, 'normal');
            textY += 20;
            
            // Add additional info if available
            if (image.check_number) {
                doc.text(`Check #:`, textX, textY);
                doc.setFont(undefined, 'bold');
                doc.text(`${image.check_number}`, textX + 30, textY);
                doc.setFont(undefined, 'normal');
                textY += 10;
            }
            
            if (image.payment_type) {
                doc.text(`Payment:`, textX, textY);
                doc.setFont(undefined, 'bold');
                doc.text(`${image.payment_type}`, textX + 30, textY);
                doc.setFont(undefined, 'normal');
                textY += 10;
            }
            
            if (image.signed !== undefined) {
                doc.text(`Signed:`, textX, textY);
                doc.setFont(undefined, 'bold');
                doc.text(`${image.signed ? 'Yes' : 'No'}`, textX + 30, textY);
                doc.setFont(undefined, 'normal');
                textY += 10;
            }
            
            // Add the image on the right half
            if (image.image_url) {
                // For base64 images
                if (image.image_url.startsWith('data:')) {
                    try {
                        // Load the image to get its dimensions
                        const img = new Image();
                        img.src = image.image_url;
                        
                        // Right half starting position
                        const imageX = pageWidth / 2 + margin / 2;
                        const imageY = margin;
                        
                        // Available space for image
                        const availableWidth = rightHalfWidth;
                        const availableHeight = contentHeight;
                        
                        // Calculate image dimensions while preserving aspect ratio
                        let imgWidth = img.width;
                        let imgHeight = img.height;
                        
                        // Calculate aspect ratio
                        const aspectRatio = imgWidth / imgHeight;
                        
                        // For receipt images, which are typically tall and narrow (portrait),
                        // we want to maximize the height to make them more readable
                        
                        // First, try to use full height
                        imgHeight = availableHeight;
                        imgWidth = imgHeight * aspectRatio;
                        
                        // If width is too large, scale down
                        if (imgWidth > availableWidth) {
                            imgWidth = availableWidth;
                            imgHeight = imgWidth / aspectRatio;
                        }
                        
                        // Center the image horizontally within its half
                        const centeredX = imageX + (availableWidth - imgWidth) / 2;
                        
                        // Add image to PDF
                        doc.addImage(
                            image.image_url,
                            'JPEG',
                            centeredX,
                            imageY,
                            imgWidth,
                            imgHeight,
                            `img-${index}`,
                            'MEDIUM',
                            pdfOptions.imageQuality
                        );
                        
                        // Process next image
                        processImage(index + 1);
                    } catch (err) {
                        console.error(`Error adding image ${index}:`, err);
                        // Continue with next image even if this one fails
                        processImage(index + 1);
                    }
                } else {
                    // For URL images, we would need to load them first
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        
                        try {
                            // Right half starting position
                            const imageX = pageWidth / 2 + margin / 2;
                            const imageY = margin;
                            
                            // Available space for image
                            const availableWidth = rightHalfWidth;
                            const availableHeight = contentHeight;
                            
                            // Calculate image dimensions while preserving aspect ratio
                            let imgWidth = img.width;
                            let imgHeight = img.height;
                            
                            // Calculate aspect ratio
                            const aspectRatio = imgWidth / imgHeight;
                            
                            // For receipt images, which are typically tall and narrow (portrait),
                            // we want to maximize the height to make them more readable
                            
                            // First, try to use full height
                            imgHeight = availableHeight;
                            imgWidth = imgHeight * aspectRatio;
                            
                            // If width is too large, scale down
                            if (imgWidth > availableWidth) {
                                imgWidth = availableWidth;
                                imgHeight = imgWidth / aspectRatio;
                            }
                            
                            // Center the image horizontally within its half
                            const centeredX = imageX + (availableWidth - imgWidth) / 2;
                            
                            // Add image to PDF
                            doc.addImage(
                                canvas.toDataURL('image/jpeg', pdfOptions.imageQuality),
                                'JPEG',
                                centeredX,
                                imageY,
                                imgWidth,
                                imgHeight,
                                `img-${index}`,
                                'MEDIUM'
                            );
                        } catch (err) {
                            console.error(`Error adding image ${index}:`, err);
                        }
                        
                        // Process next image
                        processImage(index + 1);
                    };
                    
                    img.onerror = function() {
                        console.error(`Failed to load image ${index} from URL:`, image.image_url);
                        // Continue with next image
                        processImage(index + 1);
                    };
                    
                    img.src = image.image_url;
                    return; // Exit here as the onload callback will handle the next image
                }
            } else {
                // No image URL, skip to next image
                processImage(index + 1);
            }
        };
        
        // Start processing images
        processImage(0);
        
    } catch (error) {
        console.error('Error generating PDF with images:', error);
        showNotification('Failed to generate PDF with images', 'error');
    }
}
