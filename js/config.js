/**
 * Configuration settings for the Bar Receipt Tip Extractor application
 */
const config = {
    // Application settings
    app: {
        name: 'TipEnter',
        version: '1.0.0',
        location: 'Pittsburgh'
    },
    
    // API settings
    api: {
        useRealApi: true, // Set to true to use the actual Claude API
        endpoint: '/api/process-images',
        maxImagesPerRequest: 5
    },
    
    // File processing settings
    fileProcessing: {
        maxFiles: 100,
        minFiles: 1,
        supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
        maxImageDimension: 1200,
        imageQuality: 0.8 // 80% quality for compression
    },
    
    // UI settings
    ui: {
        defaultTab: 'scanner-tab',
        defaultSortField: 'amount',
        defaultSortOrder: 'asc',
        defaultFilterField: 'amount'
    },
    
    // Test mode settings
    testing: {
        enabled: false, // Keep this false to prevent generating sample images
        sampleCount: 50 // Number of sample images to generate in test mode
    }
};

export default config;
