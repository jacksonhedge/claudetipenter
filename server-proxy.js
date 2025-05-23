/**
 * Server Proxy for Claude API and Image Processing
 * This server handles:
 * 1. Communication with Claude API to avoid CORS issues
 * 2. Receiving and processing images from iOS app
 * 3. Image optimization before processing
 * 4. Caching of results to reduce API calls
 */
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // For image optimization
const crypto = require('crypto');
const NodeCache = require('node-cache');

// Initialize cache with 1 hour expiration time
const receiptCache = new NodeCache({ stdTTL: 3600 });

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Middleware for parsing JSON and URL-encoded data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure Anthropic API settings
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

console.log('API Key loaded:', ANTHROPIC_API_KEY ? 'Yes' : 'No');

/**
 * Process image with Anthropic API
 * @param {string} imagePath Path to the image file
 * @returns {Promise<object>} Extracted receipt data
 */
async function processWithAnthropic(imagePath) {
  try {
    // Read the image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Optimized prompt for vision processing
    const prompt = `
    I need to extract key information from this receipt image. Return ONLY a JSON object with this structure:
    
    {
      "merchant_name": "",      // Name of the business/restaurant
      "date": "",               // Format: MM/DD/YYYY or empty if unclear
      "time": "",               // Format: HH:MM AM/PM or empty if unclear
      "receipt_number": "",     // Any receipt/check/order number
      "subtotal": 0.00,         // Pre-tip amount (numeric, no $ symbol)
      "tip": 0.00,              // Tip amount (numeric, no $ symbol)
      "total": 0.00,            // Final total (numeric, no $ symbol)
      "payment_method": "",     // VISA/MC/AMEX/CASH/etc.
      "customer_name": "",      // If present on receipt
      "server_name": "",        // If present on receipt
      "confidence": {           // Confidence scores (0-1)
        "subtotal": 0.0,
        "tip": 0.0,
        "total": 0.0
      },
      "rendering_cost": {       // Cost information
        "input_tokens": 0,      // Estimated input tokens
        "output_tokens": 0,     // Estimated output tokens
        "total_cost": 0.00      // Estimated total cost in USD
      }
    }
    
    For each field you're uncertain about, include a confidence score (0-1) in the confidence object. Extract numerical values as numbers without currency symbols. If a field is absent, use an empty string for text or 0 for numbers.
    
    Also include your best estimate of the rendering cost in the rendering_cost object, with input tokens, output tokens, and total cost in USD.
    
    DO NOT include any text, explanation, or notes outside the JSON object. The response should ONLY contain valid, parseable JSON.
    `;
    
    // Create the request
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Extract JSON from response
    const text = response.data.content[0].text;
    let jsonData;
    
    try {
      // Try to parse JSON directly first
      jsonData = JSON.parse(text);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the text
      const jsonMatch = text.match(/{[\s\S]*?}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in API response');
      }
    }
    
    return jsonData;
    
  } catch (error) {
    console.error('Anthropic API error:', error);
    
    // Provide more details about the error
    if (error.response) {
      console.error('API response status:', error.response.status);
      console.error('API response data:', error.response.data);
    }
    
    throw error;
  }
}

/**
 * Process image with Anthropic API with retries and caching
 * @param {string} imagePath Path to the image file
 * @param {number} maxRetries Maximum number of retries on failure
 * @returns {Promise<object>} Extracted receipt data
 */
async function processWithAnthropicWithRetry(imagePath, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Generate a cache key based on image content
      const imageHash = crypto
        .createHash('md5')
        .update(fs.readFileSync(imagePath))
        .digest('hex');
      
      // Check cache first
      const cachedResult = receiptCache.get(imageHash);
      if (cachedResult) {
        console.log('Cache hit for image:', imageHash);
        return cachedResult;
      }
      
      console.log('Cache miss for image:', imageHash);
      
      // Process with API
      const result = await processWithAnthropic(imagePath);
      
      // Save to cache
      receiptCache.set(imageHash, result);
      
      return result;
    } catch (error) {
      attempt++;
      
      // Check if we should retry
      const shouldRetry = attempt < maxRetries && 
        (error.response?.status === 429 || // Rate limit
         error.response?.status >= 500);    // Server error
      
      if (shouldRetry) {
        console.log(`API call failed, retrying (${attempt}/${maxRetries})...`);
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      } else {
        throw error; // Rethrow if we're out of retries
      }
    }
  }
}

/**
 * Image optimization function
 * Resizes and compresses images for better processing
 */
async function optimizeImage(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(1200, 1600, { // Reduced size for better cost efficiency
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 75 }) // Slightly reduced quality for better compression
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Image optimization error:', error);
    throw error;
  }
}

// Endpoint for batch processing multiple receipts
app.post('/api/batch-process', upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }
    
    console.log(`Received batch upload: ${req.files.length} images`);
    
    const results = [];
    const errors = [];
    
    // Process images in sequence (to avoid rate limits)
    for (const file of req.files) {
      try {
        // Get the uploaded file path
        const imagePath = file.path;
        
        // Optimize the image
        const optimizedImagePath = imagePath + '-optimized.jpg';
        await optimizeImage(imagePath, optimizedImagePath);
        
        // Process the image
        const result = await processWithAnthropicWithRetry(optimizedImagePath);
        
        // Add result with filename
        results.push({
          filename: file.originalname,
          data: result
        });
        
        // Clean up temporary files
        fs.unlinkSync(imagePath);
        fs.unlinkSync(optimizedImagePath);
      } catch (error) {
        console.error(`Error processing image ${file.originalname}:`, error);
        
        // Add to errors array
        errors.push({
          filename: file.originalname,
          error: error.message
        });
        
        // Clean up files even on error
        try {
          fs.unlinkSync(file.path);
          const optimizedPath = file.path + '-optimized.jpg';
          if (fs.existsSync(optimizedPath)) {
            fs.unlinkSync(optimizedPath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up files:', cleanupError);
        }
      }
    }
    
    // Return all results and errors
    return res.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    });
  } catch (error) {
    console.error('Error in batch processing:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint for processing single receipt
app.post('/api/process-receipt', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    console.log(`Received image upload: ${req.file.originalname}`);
    
    // Get the uploaded file path
    const imagePath = req.file.path;
    
    // Optimize the image
    const optimizedImagePath = imagePath + '-optimized.jpg';
    await optimizeImage(imagePath, optimizedImagePath);
    console.log(`Optimized image: ${optimizedImagePath}`);
    
    try {
      // Calculate estimated cost before processing
      // Claude-3-Haiku pricing: $0.25/1M input tokens, $1.25/1M output tokens
      const imageBuffer = fs.readFileSync(optimizedImagePath);
      const base64ImageSize = imageBuffer.toString('base64').length;
      
      // Process the image with Anthropic API (with caching and retries)
      const result = await processWithAnthropicWithRetry(optimizedImagePath);
      
      // Clean up - delete the temporary files
      fs.unlinkSync(imagePath);
      fs.unlinkSync(optimizedImagePath);
      const inputTokenEstimate = Math.ceil(base64ImageSize / 3); // Very rough estimate
      const outputTokenEstimate = JSON.stringify(result).length / 4; // Very rough estimate
      const inputCost = (inputTokenEstimate / 1000000) * 0.25;
      const outputCost = (outputTokenEstimate / 1000000) * 1.25;
      const totalCost = inputCost + outputCost;
      
      // Add cost information to the result
      const costInfo = {
        estimated_input_tokens: inputTokenEstimate,
        estimated_output_tokens: outputTokenEstimate,
        estimated_cost_usd: totalCost.toFixed(6),
        disclaimer: "This is a rough estimate based on token approximation"
      };
      
      // Add rendering cost to the result if not already present
      if (result && !result.rendering_cost) {
        result.rendering_cost = {
          input_tokens: inputTokenEstimate,
          output_tokens: outputTokenEstimate,
          total_cost: totalCost
        };
      }
      
      // Return the processed data with cost information
      return res.json({
        success: true,
        model: 'claude-3-haiku',
        result: result,
        cost_info: costInfo
      });
    } catch (parseError) {
      console.error('Error processing receipt:', parseError);
      
      // Clean up temporary files even if there was an error
      try {
        fs.unlinkSync(imagePath);
        if (fs.existsSync(optimizedImagePath)) {
          fs.unlinkSync(optimizedImagePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up files:', cleanupError);
      }
      
      // Return error response
      return res.status(500).json({
        success: false,
        error: parseError.message,
        model: 'claude-3-haiku'
      });
    }
  } catch (error) {
    console.error('Error processing image with Claude:', error);
    
    // Return a more detailed error response
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

// Direct base64 endpoint (for mobile apps that process images on-device)
app.post('/api/process-receipt-base64', async (req, res) => {
  try {
    const { image, filename } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    console.log(`Processing receipt from base64: ${filename || 'unnamed'}`);
    
    // Save base64 to temporary file for processing
    const tempImagePath = path.join(__dirname, 'uploads', `temp-${Date.now()}.jpg`);
    const optimizedImagePath = tempImagePath + '-optimized.jpg';
    
    // Ensure uploads directory exists
    if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
      fs.mkdirSync(path.join(__dirname, 'uploads'));
    }
    
    // Convert base64 to file
    const imageData = image.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(tempImagePath, Buffer.from(imageData, 'base64'));
    
    // Optimize the image
    await optimizeImage(tempImagePath, optimizedImagePath);
    
    try {
      // Process with Claude API
      const result = await processWithAnthropicWithRetry(optimizedImagePath);
      
      // Clean up temporary files
      fs.unlinkSync(tempImagePath);
      fs.unlinkSync(optimizedImagePath);
      
      // Return results
      return res.json({
        success: true,
        model: 'claude-3-haiku',
        result: result
      });
    } catch (error) {
      console.error('Error processing base64 image:', error);
      
      // Clean up temporary files
      try {
        fs.unlinkSync(tempImagePath);
        if (fs.existsSync(optimizedImagePath)) {
          fs.unlinkSync(optimizedImagePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up files:', cleanupError);
      }
      
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error in base64 processing:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache_stats: {
      keys: receiptCache.keys().length,
      hits: receiptCache.getStats().hits,
      misses: receiptCache.getStats().misses
    }
  });
});

// Get cache stats endpoint
app.get('/api/cache-stats', (req, res) => {
  const stats = receiptCache.getStats();
  const keys = receiptCache.keys();
  
  res.json({
    total_items: keys.length,
    hits: stats.hits,
    misses: stats.misses,
    keys: keys
  });
});

// Clear cache endpoint
app.post('/api/clear-cache', (req, res) => {
  const keysCount = receiptCache.keys().length;
  receiptCache.flushAll();
  
  res.json({
    success: true,
    cleared_items: keysCount,
    message: `Cleared ${keysCount} items from cache`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'An unexpected error occurred'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server proxy running at http://localhost:${port}`);
  console.log(`Upload endpoint available at http://localhost:${port}/api/process-receipt`);
  console.log(`Batch upload endpoint available at http://localhost:${port}/api/batch-process`);
  console.log(`Health check available at http://localhost:${port}/api/health`);
});
