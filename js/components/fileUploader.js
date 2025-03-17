/**
 * File Uploader Component
 * Handles file selection, drag & drop, and file list management
 */
import { addFiles, removeFile, clearAllFiles, getFileCount, isFileCountValid, getSelectedFiles } from '../services/fileService.js';
import { createElement, confirmDialog } from '../utils/uiUtils.js';
import config from '../config.js';

export default class FileUploader {
    /**
     * Initialize the file uploader component
     * @param {Object} options - Configuration options
     * @param {string} options.dropAreaId - ID of the drop area element
     * @param {string} options.fileInputId - ID of the file input element
     * @param {string} options.fileListId - ID of the file list container
     * @param {string} options.fileCountId - ID of the file count element
     * @param {string} options.processBtnId - ID of the process button
     * @param {Function} options.onFileCountChange - Callback when file count changes
     */
    constructor(options) {
        this.options = options;
        
        // DOM Elements
        this.dropArea = document.getElementById(options.dropAreaId);
        this.fileInput = document.getElementById(options.fileInputId);
        this.fileList = document.getElementById(options.fileListId);
        this.fileCount = document.getElementById(options.fileCountId);
        this.processBtn = document.getElementById(options.processBtnId);
        
        // Ensure required elements exist
        if (!this.dropArea || !this.fileInput || !this.fileList) {
            console.error('Required elements not found for FileUploader');
            return;
        }
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Add clear all button if it doesn't exist
        this.addClearAllButton();
        
        // Event Listeners
        this.dropArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // Bind the file select handler directly
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Initial update
        this.updateFileCount();
        this.validateFileCount();
    }
    
    /**
     * Add clear all button to the file list header
     */
    addClearAllButton() {
        // Find the file-list-container
        const fileListContainer = this.fileList.parentElement;
        if (!fileListContainer) return;
        
        // Check if file-list-header exists, if not create it
        let fileListHeader = fileListContainer.querySelector('.file-list-header');
        if (!fileListHeader) {
            // Create the header
            fileListHeader = createElement('div', { className: 'file-list-header' });
            
            // Move the existing h3 into the header
            const existingH3 = fileListContainer.querySelector('h3');
            if (existingH3) {
                fileListHeader.appendChild(existingH3.cloneNode(true));
                existingH3.remove();
            } else {
                // Create a new h3 if it doesn't exist
                const newH3 = createElement('h3', {}, [
                    'Selected Files ',
                    createElement('span', { id: this.options.fileCountId }, '(0)')
                ]);
                fileListHeader.appendChild(newH3);
            }
            
            // Create clear all button
            const clearAllBtn = createElement('button', {
                id: 'clearAllBtn',
                className: 'clear-all-btn',
                onClick: this.handleClearAll.bind(this)
            }, 'Clear All');
            fileListHeader.appendChild(clearAllBtn);
            
            // Insert the header before the file list
            fileListContainer.insertBefore(fileListHeader, this.fileList);
        } else {
            // If header exists but button doesn't, add it
            let clearAllBtn = fileListHeader.querySelector('#clearAllBtn');
            if (!clearAllBtn) {
                clearAllBtn = createElement('button', {
                    id: 'clearAllBtn',
                    className: 'clear-all-btn',
                    onClick: this.handleClearAll.bind(this)
                }, 'Clear All');
                fileListHeader.appendChild(clearAllBtn);
            }
        }
    }
    
    /**
     * Handle drag over event
     * @param {DragEvent} e - The drag event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropArea.classList.add('active');
    }
    
    /**
     * Handle drag leave event
     * @param {DragEvent} e - The drag event
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropArea.classList.remove('active');
    }
    
    /**
     * Handle drop event
     * @param {DragEvent} e - The drop event
     */
    async handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropArea.classList.remove('active');
        
        const files = e.dataTransfer.files;
        await this.processFiles(files);
    }
    
    /**
     * Handle file select event
     * @param {Event} e - The change event
     */
    async handleFileSelect(e) {
        const files = e.target.files;
        await this.processFiles(files);
        this.fileInput.value = ''; // Reset file input only after processing is complete
    }
    
    /**
     * Process the selected files
     * @param {FileList} files - The files to process
     */
    async processFiles(files) {
        await addFiles(files, this.createFilePreview.bind(this));
        this.updateFileCount();
        this.validateFileCount();
    }
    
    /**
     * Create a file preview element
     * @param {File} file - The file to preview
     * @param {number} fileId - The unique ID for this file
     */
    createFilePreview(file, fileId) {
        const fileItem = createElement('div', {
            className: 'file-item',
            dataset: { fileId }
        });
        
        const fileName = createElement('div', { className: 'file-name' });
        
        // Create thumbnail
        const thumbnail = createElement('img', {
            width: 40,
            height: 40
        });
        
        // Set appropriate icon based on file type
        if (file.type === 'application/pdf') {
            // PDF icon
            thumbnail.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlNzRjM2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTQgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjh6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iMTQgMiAxNCA4IDIwIDgiPjwvcG9seWxpbmU+PHBhdGggZD0iTTkgMTVoNiI+PC9wYXRoPjxwYXRoIGQ9Ik05IDExaDYiPjwvcGF0aD48L3N2Zz4=';
            
            // Add page number badge if this is a page from a multi-page PDF
            if (file.pdfPageNumber && file.totalPages > 1) {
                thumbnail.style.position = 'relative';
                
                // Create a small badge to show page number
                const pageBadge = createElement('div', {
                    style: {
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }
                }, file.pdfPageNumber);
                
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
        const nameText = createElement('span', {}, file.name);
        
        fileName.appendChild(thumbnail);
        fileName.appendChild(nameText);
        
        // Remove button
        const removeBtn = createElement('button', {
            className: 'remove-file',
            onClick: (e) => {
                e.stopPropagation(); // Prevent triggering the parent click event
                removeFile(fileId);
                fileItem.remove();
                this.updateFileCount();
                this.validateFileCount();
            }
        }, 'Remove');
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(removeBtn);
        this.fileList.appendChild(fileItem);
    }
    
    /**
     * Handle clear all button click
     */
    handleClearAll() {
        // Show confirmation dialog
        if (getFileCount() === 0) {
            return; // No files to clear
        }
        
        confirmDialog(
            'Are you sure you want to remove all files?',
            () => {
                // Clear all files
                clearAllFiles();
                this.fileList.innerHTML = '';
                this.updateFileCount();
                this.validateFileCount();
            }
        );
    }
    
    /**
     * Update the file count display
     */
    updateFileCount() {
        const count = getFileCount();
        if (this.fileCount) {
            this.fileCount.textContent = `(${count})`;
        }
        
        // Call the callback if provided
        if (this.options.onFileCountChange) {
            this.options.onFileCountChange(count);
        }
    }
    
    /**
     * Validate the file count and update UI accordingly
     */
    validateFileCount() {
        if (this.processBtn) {
            // Check if this is the Tip Analyzer uploader
            const isTipAnalyzer = this.options.dropAreaId === 'dropArea';
            this.processBtn.disabled = !isFileCountValid(isTipAnalyzer);
        }
    }
    
    /**
     * Handle click on the drop area
     * @param {MouseEvent} e - The click event
     */
    handleDropAreaClick(e) {
        // Prevent any existing event listeners from being triggered multiple times
        e.preventDefault();
        e.stopPropagation();
        
        // Temporarily remove the change event listener
        this.fileInput.removeEventListener('change', this._boundHandleFileSelect);
        
        // Reset the file input value to ensure the change event fires even if selecting the same file
        this.fileInput.value = '';
        
        // Re-attach the event listener
        this.fileInput.addEventListener('change', this._boundHandleFileSelect);
        
        // Trigger the file input click
        this.fileInput.click();
    }
    
    /**
     * Get all selected files
     * @returns {Array} - Array of selected files
     */
    getFiles() {
        return getSelectedFiles();
    }
}
