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
        useRealApi: true, // Set to true to use the actual API instead of simulated data
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
    
    // Tip Analyzer settings
    tipAnalyzer: {
        minFiles: 3 // Minimum files required for tip analysis
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
        enabled: false, // Disable test mode to allow uploading real files
        sampleCount: 10 // Number of sample images to generate in test mode
    }
};

export default config;
