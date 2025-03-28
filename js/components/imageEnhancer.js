/**
 * Image Enhancer Component
 * This component handles image enhancement using the IntSig SDK API
 */
class ImageEnhancer {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/enhance-image';
        this.enhanceMode = options.enhanceMode || 'auto';
        this.maxSize = options.maxSize || 1600;
        this.onProgress = options.onProgress || (() => {});
        this.onComplete = options.onComplete || (() => {});
        this.onError = options.onError || (() => {});
        
        this.processingQueue = [];
        this.isProcessing = false;
    }
    
    /**
     * Initialize the component
     */
    init() {
        console.log('ImageEnhancer initialized');
        return this;
    }
    
    /**
     * Add an image file to the processing queue
     * @param {File} file - The image file to process
     * @returns {Promise} Promise that resolves when the file is queued
     */
    addToQueue(file) {
        return new Promise((resolve) => {
            this.processingQueue.push({
                file,
                status: 'queued'
            });
            resolve(this.processingQueue.length - 1);
        });
    }
    
    /**
     * Start processing the queue
     * @returns {Promise} Promise that resolves when all processing is complete
     */
    processQueue() {
        if (this.isProcessing) {
            console.warn('Already processing queue');
            return Promise.resolve();
        }
        
        this.isProcessing = true;
        
        return this._processNextInQueue();
    }
    
    /**
     * Process the next item in the queue
     * @private
     * @returns {Promise} Promise that resolves when processing is complete
     */
    _processNextInQueue() {
        if (this.processingQueue.length === 0) {
            this.isProcessing = false;
            this.onComplete();
            return Promise.resolve();
        }
        
        const nextItemIndex = this.processingQueue.findIndex(item => item.status === 'queued');
        
        if (nextItemIndex === -1) {
            this.isProcessing = false;
            this.onComplete();
            return Promise.resolve();
        }
        
        const item = this.processingQueue[nextItemIndex];
        item.status = 'processing';
        
        this.onProgress({
            queueLength: this.processingQueue.length,
            processed: this.processingQueue.filter(i => i.status === 'completed').length,
            failed: this.processingQueue.filter(i => i.status === 'failed').length,
            currentItem: nextItemIndex
        });
        
        return this._processFile(item.file)
            .then((result) => {
                item.status = 'completed';
                item.result = result;
                
                return this._processNextInQueue();
            })
            .catch((error) => {
                console.error('Error processing file:', error);
                item.status = 'failed';
                item.error = error.message;
                
                this.onError(error, item);
                
                return this._processNextInQueue();
            });
    }
    
    /**
     * Process a single file using the IntSig API
     * @private
     * @param {File} file - The image file to process
     * @returns {Promise} Promise that resolves with the processing result
     */
    _processFile(file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('enhanceMode', this.enhanceMode);
        formData.append('maxSize', this.maxSize);
        
        return fetch(this.apiEndpoint, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.details || 'Image enhancement failed');
                });
            }
            return response.json();
        });
    }
    
    /**
     * Process a single file and return the result immediately
     * @param {File} file - The image file to process
     * @returns {Promise} Promise that resolves with the processing result
     */
    processSingleFile(file) {
        return this._processFile(file);
    }
    
    /**
     * Clear the processing queue
     */
    clearQueue() {
        this.processingQueue = [];
        this.isProcessing = false;
    }
    
    /**
     * Set the enhance mode
     * @param {string} mode - The enhance mode ('auto', 'document', 'photo')
     */
    setEnhanceMode(mode) {
        this.enhanceMode = mode;
    }
    
    /**
     * Set the max output size
     * @param {number} size - The maximum dimension of the output image
     */
    setMaxSize(size) {
        this.maxSize = size;
    }
}

// Make available for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageEnhancer };
} else {
    window.ImageEnhancer = ImageEnhancer;
}
