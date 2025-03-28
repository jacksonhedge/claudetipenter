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
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: Anthropic API key not found. Please set ANTHROPIC_API_KEY in environment variables.');
  process.exit(1);
}

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
    
    // Create the request
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the following receipt info and return as JSON:
                - customer_name: Restaurant/merchant name
                - date: Date (MM/DD/YYYY)
                - time: Time (HH:MM AM/PM)
                - check_number: Receipt/order number
                - amount: Subtotal pre-tip with currency symbol
                - tip: Tip amount with currency symbol
                - total: Total amount with currency symbol
                - payment_type: Card/cash type
                - signed: "yes" or "no"
                
                IMPORTANT: Respond ONLY with a valid JSON object in exactly this format:
                {
                  "customer_name": "NAME",
                  "date": "MM/DD/YYYY",
                  "time": "HH:MM AM/PM",
                  "check_number": "####",
                  "amount": "$XX.XX",
                  "tip": "$X.XX",
                  "total": "$XX.XX",
                  "payment_type": "TYPE",
                  "signed": "yes/no"
                }
                
                Use null for any missing fields. DO NOT include any explanations, comments, or text outside of the JSON object.`
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
    const jsonMatch = text.match(/{[\s\S]*?}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in API response');
    }
    
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
      .resize(1600, 2000, { // Resize to reasonable dimensions
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 }) // Compress to reasonable quality
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Image optimization error:', error);
    throw error;
  }
}

// Endpoint for processing receipts with Claude
app.post('/api/process-receipt', async (req, res) => {
  try {
    const { image, filename } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    console.log(`Processing receipt: ${filename || 'unnamed'}`);
    
    // Create the prompt for the API
    const prompt = `
      Please analyze this receipt image. Extract the following information in JSON format:
      
      1. Customer name (if available)
      2. Date (format: MM/DD/YYYY)  
      3. Time (format: HH:MM AM/PM)
      4. Check number (if available)
      5. Amount (pre-tip total, format: $X.XX)
      6. Tip amount (format: $X.XX)
      7. Total amount (format: $X.XX)
      8. Payment type (Credit Card, Cash, etc.)
      9. Whether it was signed (Yes/No)
      
      Return the data in this exact JSON structure:
      {
        "customer_name": "John Doe",
        "date": "03/25/2025",
        "time": "7:30 PM",
        "check_number": "#1234",
        "amount": "$45.67",
        "tip": "$9.13",
        "total": "$54.80",
        "payment_type": "Credit Card",
        "signed": "Yes"
      }
      
      If any field is not found in the receipt, use "N/A" for text fields and "$0.00" for monetary values.
    `;
    
    // Call Claude API
    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: 'claude-3-opus-20240229',
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
                  data: image
                }
              }
            ]
          }
        ]
      },
      {
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract the response from Claude
    const claudeResponse = response.data.content[0].text;
    
    // Try to parse JSON from the response
    try {
      // Extract JSON from Claude's response (it might have extra text)
      const jsonMatch = claudeResponse.match(/```json\n([\s\S]*?)\n```/) || 
                         claudeResponse.match(/{[\s\S]*}/) ||
                         claudeResponse;
                         
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsedData = JSON.parse(jsonText);
      
      // Return the processed data
      return res.json({
        success: true,
        model: 'claude-3-opus',
        result: parsedData
      });
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      // If JSON parsing fails, return the raw text
      return res.json({
        success: true,
        model: 'claude-3-opus',
        result: claudeResponse,
        parsing_error: true
      });
    }
  } catch (error) {
    console.error('Error processing receipt with Claude:', error);
    
    // Return a more detailed error response
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

// Endpoint for receiving image uploads from iOS app
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
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
      // Process the image with Anthropic API (with caching and retries)
      const result = await processWithAnthropicWithRetry(optimizedImagePath);
      
      // Clean up - delete the temporary files
      fs.unlinkSync(imagePath);
      fs.unlinkSync(optimizedImagePath);
      
      // Return the processed data
      return res.json({
        success: true,
        model: 'claude-3-haiku',
        result: result
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all receipts endpoint (placeholder for future database implementation)
app.get('/api/receipts', (req, res) => {
  // TODO: Implement database retrieval
  res.json({ receipts: [] });
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
  console.log(`Upload endpoint available at http://localhost:${port}/api/upload-image`);
  console.log(`Health check available at http://localhost:${port}/api/health`);
});
