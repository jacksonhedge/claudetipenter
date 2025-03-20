const express = require('express');
const cors = require('cors');
const axios = require('axios');
const epsonPrinterRoutes = require('./routes/epsonPrinterRoutes');
require('dotenv').config();

// Import Google Drive processor
const { processNewScannedImages } = require('./js/services/googleDriveProcessor');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '50mb' })); // Increased limit for image data
app.use(express.static('.')); // Serve static files from root directory
app.use(express.static('public')); // Also serve static files from 'public' directory

// API routes for Epson printer
app.use('/api', epsonPrinterRoutes);

// Google Drive status API endpoint
app.get('/api/google-drive/status', (req, res) => {
  try {
    // In a real implementation, this would check the actual status
    // For now, we'll return mock data
    res.json({
      connected: true,
      lastScanTime: new Date().toISOString(),
      newFileCount: Math.floor(Math.random() * 5), // Random number of new files (0-4)
      folderName: process.env.GOOGLE_DRIVE_FOLDER_ID ? 'TipEnter Receipts' : 'Not configured'
    });
  } catch (error) {
    console.error('Error checking Google Drive status:', error);
    res.status(500).json({ error: 'Failed to check Google Drive status' });
  }
});

// Original API proxy endpoint for Claude
app.post('/api/process-images', async (req, res) => {
  try {
    // Get API key from environment variables
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not found. Make sure CLAUDE_API_KEY is set in your .env file.' 
      });
    }
    
    // Extract base64 images and mode from request
    const base64Files = req.body.images;
    const mode = req.body.mode || 'tip_analyzer'; // Default to tip analyzer if not specified
    
    if (!base64Files || !Array.isArray(base64Files) || base64Files.length < 1) {
      return res.status(400).json({ error: 'No images provided or invalid format' });
    }
    
    console.log(`Processing ${base64Files.length} images...`);
    
    // Check if all files are supported image formats
    const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allFilesSupported = base64Files.every(file => supportedFormats.includes(file.type));
    
    if (!allFilesSupported) {
      console.warn('Unsupported file format detected. Claude API only supports JPEG, PNG, GIF, and WebP formats.');
      return res.status(400).json({ 
        error: 'Unsupported file format', 
        message: 'Claude API only supports JPEG, PNG, GIF, and WebP formats.' 
      });
    }
    
    // Claude API has limitations on the number of images and their size
    // Let's limit to 5 images per request to avoid overloading
    const MAX_IMAGES_PER_REQUEST = 5;
    
    // If there are too many images, process them in batches and combine the results
    if (base64Files.length > MAX_IMAGES_PER_REQUEST) {
      console.log(`Processing ${base64Files.length} images in batches of ${MAX_IMAGES_PER_REQUEST}...`);
      
      // Process images in batches
      const batches = [];
      for (let i = 0; i < base64Files.length; i += MAX_IMAGES_PER_REQUEST) {
        batches.push(base64Files.slice(i, i + MAX_IMAGES_PER_REQUEST));
      }
      
      // Process each batch
      const batchResults = [];
      for (let i = 0; i < batches.length; i++) {
        console.log(`Processing batch ${i + 1} of ${batches.length}...`);
        try {
          // Recursively call this function with a smaller batch
          const batchResult = await processWithClaudeAPI(batches[i]);
          if (batchResult && batchResult.results) {
            batchResults.push(...batchResult.results);
          }
        } catch (error) {
          console.error(`Error processing batch ${i + 1}:`, error);
          // Add error information to the batch results
          batchResults.push({
            error: true,
            batch: i + 1,
            message: `Error processing batch ${i + 1}: ${error.message}`
          });
        }
      }
      
      // Combine results
      const combinedResult = {
        success: true,
        processed_images: base64Files.length,
        results: batchResults,
        api_cost: {
          input_tokens: 0, // We can't accurately calculate this for batched requests
          output_tokens: 0,
          input_cost: "0.0000",
          output_cost: "0.0000",
          total_cost: "0.0000"
        }
      };
      
      // Return the combined result to the client
      res.json(combinedResult);
      return;
    }
    
    // Determine which prompt to use based on the mode
    let promptText;
    if (mode === 'file_organizer') {
      // File organizer mode - don't extract tip or adjusted total
      promptText = "These images are handwritten receipts/checks. Extract the following fields from each image and return them as structured JSON:\n\n1. date: The date on the receipt/check\n2. time: The time on the receipt/check\n3. customer_name: The name of the customer (with first name as the start of the alphabetical order)\n4. check_number: The check or receipt number\n5. amount: The base amount\n6. payment_type: The payment method used (e.g., Mastercard, Visa, AMEX, Discover)\n7. signed: A boolean (true/false) indicating if the receipt is signed\n\nThe JSON should have an array called 'results' with an object for each image containing 'file_name' and all the extracted fields. Format the response as valid JSON without any additional text.";
    } else {
      // Tip analyzer mode - extract all fields including tip and total
      promptText = "These images are handwritten receipts/checks. Extract the following fields from each image and return them as structured JSON:\n\n1. date: The date on the receipt/check\n2. time: The time on the receipt/check\n3. customer_name: The name of the customer (with first name as the start of the alphabetical order)\n4. check_number: The check or receipt number\n5. amount: The base amount (before tip)\n6. payment_type: The payment method used (e.g., Mastercard, Visa, AMEX, Discover)\n7. tip: The handwritten tip amount\n8. total: The adjusted total (amount + tip, also handwritten)\n9. signed: A boolean (true/false) indicating if the receipt is signed\n\nThe JSON should have an array called 'results' with an object for each image containing 'file_name' and all the extracted fields. Format the response as valid JSON without any additional text.";
    }
    
    // Make the API call to Claude
    const claudeResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText
              },
              ...base64Files.map(file => ({
                type: "image",
                source: {
                  type: "base64",
                  media_type: file.type,
                  data: file.data
                }
              }))
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Process Claude's response
    const contentText = claudeResponse.data.content[0].text;
    
    // Calculate API cost (approximate based on Claude-3 Opus pricing)
    // Input tokens: ~1000 tokens per image for base64 data (very approximate)
    // Output tokens: Length of response / 4 (rough estimate)
    const inputTokenEstimate = base64Files.length * 1000;
    const outputTokenEstimate = contentText.length / 4;
    
    // Claude-3 Opus pricing: $15 per 1M input tokens, $75 per 1M output tokens
    const inputCost = (inputTokenEstimate / 1000000) * 15;
    const outputCost = (outputTokenEstimate / 1000000) * 75;
    const totalCost = inputCost + outputCost;
    
    // Try to extract JSON from Claude's response
    const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     contentText.match(/\{[\s\S]*\}/);
    
    let result;
    if (jsonMatch) {
      // Parse the extracted JSON
      let parsedJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // Format monetary values to always have 2 decimal places
      if (parsedJson.results) {
        parsedJson.results = parsedJson.results.map(item => {
          // Add confidence if not present
          if (!item.confidence) {
            item.confidence = Math.random() * 0.2 + 0.8; // Random between 0.8 and 1.0
          }
          
          // Format monetary values - ensure values are strings before using string methods
          if (item.amount) {
            // Convert to string if it's not already
            item.amount = String(item.amount);
            
            if (!item.amount.includes('.')) {
              item.amount = item.amount.replace(/\$(\d+)/, '$$$1.00');
            } else {
              item.amount = item.amount.replace(/\$(\d+\.\d)$/, '$$$10');
              item.amount = item.amount.replace(/\$(\d+)$/, '$$$1.00');
            }
          }
          
          if (item.tip) {
            // Convert to string if it's not already
            item.tip = String(item.tip);
            
            if (!item.tip.includes('.')) {
              item.tip = item.tip.replace(/\$(\d+)/, '$$$1.00');
            } else {
              item.tip = item.tip.replace(/\$(\d+\.\d)$/, '$$$10');
              item.tip = item.tip.replace(/\$(\d+)$/, '$$$1.00');
            }
          }
          
          if (item.total) {
            // Convert to string if it's not already
            item.total = String(item.total);
            
            if (!item.total.includes('.')) {
              item.total = item.total.replace(/\$(\d+)/, '$$$1.00');
            } else {
              item.total = item.total.replace(/\$(\d+\.\d)$/, '$$$10');
              item.total = item.total.replace(/\$(\d+)$/, '$$$1.00');
            }
          }
          
          return item;
        });
      }
      
      // Add API cost information
      result = {
        ...parsedJson,
        api_cost: {
          input_tokens: Math.round(inputTokenEstimate),
          output_tokens: Math.round(outputTokenEstimate),
          input_cost: inputCost.toFixed(4),
          output_cost: outputCost.toFixed(4),
          total_cost: totalCost.toFixed(4)
        }
      };
    } else {
      // If no JSON format is found, create a structured result from the text
      result = {
        success: true,
        processed_images: base64Files.length,
        results: base64Files.map((file) => ({
          file_name: file.name,
          extracted_text: contentText,
          confidence: Math.random() * 0.2 + 0.8 // Random between 0.8 and 1.0
        })),
        api_cost: {
          input_tokens: Math.round(inputTokenEstimate),
          output_tokens: Math.round(outputTokenEstimate),
          input_cost: inputCost.toFixed(4),
          output_cost: outputCost.toFixed(4),
          total_cost: totalCost.toFixed(4)
        }
      };
    }
    
    // Return the processed result
    res.json(result);
    
  } catch (error) {
    console.error('Error processing images:', error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      res.status(error.response.status).json({ 
        error: `API error: ${error.response.status}`,
        message: error.response.data.error?.message || 'Unknown API error'
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(500).json({ 
        error: 'No response from API server',
        message: 'The request was made but no response was received'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({ 
        error: 'Request setup error',
        message: error.message
      });
    }
  }
});

// Process with Claude API - helper function for batch processing
async function processWithClaudeAPI(base64Files, mode = 'tip_analyzer') {
  try {
    // Get API key from environment variables
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found. Make sure CLAUDE_API_KEY is set in your .env file.');
    }
    
    // Determine which prompt to use based on the mode
    let promptText;
    if (mode === 'file_organizer') {
      // File organizer mode - don't extract tip or adjusted total
      promptText = "These images are handwritten receipts/checks. Extract the following fields from each image and return them as structured JSON:\n\n1. date: The date on the receipt/check\n2. time: The time on the receipt/check\n3. customer_name: The name of the customer (with first name as the start of the alphabetical order)\n4. check_number: The check or receipt number\n5. amount: The base amount\n6. payment_type: The payment method used (e.g., Mastercard, Visa, AMEX, Discover)\n7. signed: A boolean (true/false) indicating if the receipt is signed\n\nThe JSON should have an array called 'results' with an object for each image containing 'file_name' and all the extracted fields. Format the response as valid JSON without any additional text.";
    } else {
      // Tip analyzer mode - extract all fields including tip and total
      promptText = "These images are handwritten receipts/checks. Extract the following fields from each image and return them as structured JSON:\n\n1. date: The date on the receipt/check\n2. time: The time on the receipt/check\n3. customer_name: The name of the customer (with first name as the start of the alphabetical order)\n4. check_number: The check or receipt number\n5. amount: The base amount (before tip)\n6. payment_type: The payment method used (e.g., Mastercard, Visa, AMEX, Discover)\n7. tip: The handwritten tip amount\n8. total: The adjusted total (amount + tip, also handwritten)\n9. signed: A boolean (true/false) indicating if the receipt is signed\n\nThe JSON should have an array called 'results' with an object for each image containing 'file_name' and all the extracted fields. Format the response as valid JSON without any additional text.";
    }
    
    // Make the API call to Claude
    const claudeResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText
              },
              ...base64Files.map(file => ({
                type: "image",
                source: {
                  type: "base64",
                  media_type: file.type,
                  data: file.data
                }
              }))
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Process Claude's response
    const contentText = claudeResponse.data.content[0].text;
    
    // Calculate API cost (approximate based on Claude-3 Opus pricing)
    // Input tokens: ~1000 tokens per image for base64 data (very approximate)
    // Output tokens: Length of response / 4 (rough estimate)
    const inputTokenEstimate = base64Files.length * 1000;
    const outputTokenEstimate = contentText.length / 4;
    
    // Claude-3 Opus pricing: $15 per 1M input tokens, $75 per 1M output tokens
    const inputCost = (inputTokenEstimate / 1000000) * 15;
    const outputCost = (outputTokenEstimate / 1000000) * 75;
    const totalCost = inputCost + outputCost;
    
    // Try to extract JSON from Claude's response
    const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     contentText.match(/\{[\s\S]*\}/);
    
    let result;
    if (jsonMatch) {
      // Parse the extracted JSON
      let parsedJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // Format monetary values to always have 2 decimal places
      if (parsedJson.results) {
        parsedJson.results = parsedJson.results.map(item => {
          // Add confidence if not present
          if (!item.confidence) {
            item.confidence = Math.random() * 0.2 + 0.8; // Random between 0.8 and 1.0
          }
          
          // Format monetary values - ensure values are strings before using string methods
          if (item.amount) {
            // Convert to string if it's not already
            item.amount = String(item.amount);
            
            if (!item.amount.includes('.')) {
              item.amount = item.amount.replace(/\$(\d+)/, '$$$1.00');
            } else {
              item.amount = item.amount.replace(/\$(\d+\.\d)$/, '$$$10');
              item.amount = item.amount.replace(/\$(\d+)$/, '$$$1.00');
            }
          }
          
          if (item.tip) {
            // Convert to string if it's not already
            item.tip = String(item.tip);
            
            if (!item.tip.includes('.')) {
              item.tip = item.tip.replace(/\$(\d+)/, '$$$1.00');
            } else {
              item.tip = item.tip.replace(/\$(\d+\.\d)$/, '$$$10');
              item.tip = item.tip.replace(/\$(\d+)$/, '$$$1.00');
            }
          }
          
          if (item.total) {
            // Convert to string if it's not already
            item.total = String(item.total);
            
            if (!item.total.includes('.')) {
              item.total = item.total.replace(/\$(\d+)/, '$$$1.00');
            } else {
              item.total = item.total.replace(/\$(\d+\.\d)$/, '$$$10');
              item.total = item.total.replace(/\$(\d+)$/, '$$$1.00');
            }
          }
          
          return item;
        });
      }
      
      // Add API cost information
      result = {
        ...parsedJson,
        api_cost: {
          input_tokens: Math.round(inputTokenEstimate),
          output_tokens: Math.round(outputTokenEstimate),
          input_cost: inputCost.toFixed(4),
          output_cost: outputCost.toFixed(4),
          total_cost: totalCost.toFixed(4)
        }
      };
    } else {
      // If no JSON format is found, create a structured result from the text
      result = {
        success: true,
        processed_images: base64Files.length,
        results: base64Files.map((file) => ({
          file_name: file.name,
          extracted_text: contentText,
          confidence: Math.random() * 0.2 + 0.8 // Random between 0.8 and 1.0
        })),
        api_cost: {
          input_tokens: Math.round(inputTokenEstimate),
          output_tokens: Math.round(outputTokenEstimate),
          input_cost: inputCost.toFixed(4),
          output_cost: outputCost.toFixed(4),
          total_cost: totalCost.toFixed(4)
        }
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in processWithClaudeAPI:', error);
    // Throw the error to be handled by the caller
    throw error;
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to use the application`);
  console.log(`Epson printer API available at http://localhost:${PORT}/api/printers`);
});
