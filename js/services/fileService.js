/**
 * Service for handling file operations
 */
import { compressAndConvertToBase64 } from '../utils/imageUtils.js';
import { splitPdfIntoPages } from '../utils/pdfUtils.js';
import config from '../config.js';
import { showNotification } from '../utils/uiUtils.js';

// Map to store selected files with unique IDs
const selectedFiles = new Map();
let nextFileId = 1;

/**
 * Add files to the selection
 * @param {FileList} files - The files to add
 * @param {Function} onFileAdded - Callback function when a file is added
 * @returns {Promise<void>}
 */
export async function addFiles(files, onFileAdded) {
    for (const file of files) {
        // Check if file is an image or PDF
        if (!isFileTypeSupported(file)) {
            showNotification(`${file.name} is not a supported file type.`, 'error');
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
                        
                        // Call the callback for this page
                        if (onFileAdded) {
                            onFileAdded(pageFile, fileId);
                        }
                    }
                } else if (pdfPages.length === 1) {
                    // Single page PDF, just add it normally
                    const fileId = nextFileId++;
                    selectedFiles.set(fileId, pdfPages[0]);
                    
                    // Call the callback for this file
                    if (onFileAdded) {
                        onFileAdded(pdfPages[0], fileId);
                    }
                }
            } catch (error) {
                console.error('Error splitting PDF:', error);
                showNotification(`Error processing PDF: ${file.name}`, 'error');
                
                // If there's an error splitting the PDF, add it as a single file
                const fileId = nextFileId++;
                selectedFiles.set(fileId, file);
                
                // Call the callback for this file
                if (onFileAdded) {
                    onFileAdded(file, fileId);
                }
            }
        } else {
            // For non-PDF files, add them normally
            const fileId = nextFileId++;
            selectedFiles.set(fileId, file);
            
            // Call the callback for this file
            if (onFileAdded) {
                onFileAdded(file, fileId);
            }
        }
    }
}

/**
 * Remove a file from the selection
 * @param {number} fileId - The ID of the file to remove
 * @returns {boolean} - Whether the file was successfully removed
 */
export function removeFile(fileId) {
    return selectedFiles.delete(parseInt(fileId));
}

/**
 * Clear all selected files
 */
export function clearAllFiles() {
    selectedFiles.clear();
}

/**
 * Get the count of selected files
 * @returns {number} - The number of selected files
 */
export function getFileCount() {
    return selectedFiles.size;
}

/**
 * Get all selected files
 * @returns {Array} - Array of selected files
 */
export function getSelectedFiles() {
    return Array.from(selectedFiles.values());
}

/**
 * Check if the file count is valid
 * @returns {boolean} - Whether the file count is valid
 */
export function isFileCountValid() {
    const count = selectedFiles.size;
    return count >= config.fileProcessing.minFiles && count <= config.fileProcessing.maxFiles;
}

/**
 * Check if a file type is supported
 * @param {File} file - The file to check
 * @returns {boolean} - Whether the file type is supported
 */
export function isFileTypeSupported(file) {
    return config.fileProcessing.supportedFormats.includes(file.type);
}

/**
 * Process selected files for API submission
 * @returns {Promise<Array>} - Promise resolving to an array of base64-encoded files
 */
export async function processFilesForSubmission() {
    const filesToProcess = Array.from(selectedFiles.values());
    const base64Files = [];
    
    // Process each file
    for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        try {
            // Compress and convert to base64
            const base64Data = await compressAndConvertToBase64(file);
            base64Files.push(base64Data);
        } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            showNotification(`Error processing ${file.name}`, 'error');
            // Continue with other files
        }
    }
    
    return base64Files;
}

/**
 * Export data to CSV file
 * @param {string} csvContent - The CSV content to export
 * @param {string} fileName - The name of the file to download
 */
export function exportToCSV(csvContent, fileName = 'receipt_data.csv') {
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
}
