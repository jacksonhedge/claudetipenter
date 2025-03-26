/**
 * Server Proxy for Claude API
 * This server handles communication with Claude API to avoid CORS issues
 */
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware for parsing JSON and URL-encoded data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Configure Claude API settings
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

if (!CLAUDE_API_KEY) {
  console.error('ERROR: Claude API key not found. Please set CLAUDE_API_KEY in environment variables.');
  process.exit(1);
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

// Start the server
app.listen(port, () => {
  console.log(`Server proxy running at http://localhost:${port}`);
});
