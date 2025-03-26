# Claude API Integration for TipEnter

This document explains how to set up and use the Claude API integration for receipt processing in TipEnter.

## Overview

TipEnter now uses the Claude API to process receipt images and extract data. To avoid CORS issues when calling external APIs directly from the browser, we've implemented a server proxy solution.

## Server Proxy Setup

The server proxy handles communication with the Claude API, providing a secure way to process images without exposing API keys in client-side code.

### Prerequisites

- Node.js 14+ and npm installed
- Claude API key from Anthropic

### Installation

1. Clone the repository if you haven't already:
   ```
   git clone https://github.com/jacksonhedge/claudetipenter.git
   cd claudetipenter
   ```

2. Install the required dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   
4. Edit the `.env` file and add your Claude API key:
   ```
   CLAUDE_API_KEY=your_claude_api_key_here
   ```

5. Start the server proxy:
   ```
   npm start
   ```

### Using in Production

For production deployment, you have several options:

1. **Deploy on the same server as your frontend**
   - The server proxy will be accessible at `/api/process-receipt`
   - No CORS configuration needed

2. **Deploy as a separate service**
   - Ensure you set up CORS properly if needed
   - Update the serverProxyUrl in `js/scanner-fix.js` to point to your service

## How it Works

1. When a user uploads receipt images, they are read as base64 data
2. The client sends this data to the server proxy
3. The server proxy calls the Claude API with the image data
4. Claude processes the image and returns structured receipt information
5. The server proxy sends this data back to the client
6. The client displays the extracted information in the UI

## API Response Format

Claude will extract the following fields from receipts:

```json
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
```

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   - Check that your Claude API key is correctly set in the `.env` file
   - Make sure the server has restarted after setting the API key

2. **Server Connection Issues**
   - Verify the server is running with `npm start`
   - Check the console for error messages
   - Ensure the proxy URL in the client code matches your server address

3. **Rate Limiting**
   - If you're processing many receipts, you might hit Claude API rate limits
   - Consider implementing queuing for high-volume scenarios

### Error Handling

The server implements robust error handling:

- API errors are properly captured and returned to the client
- JSON parsing errors are handled gracefully
- Network issues are reported with clear error messages

## Extending the Integration

To add support for other image processing APIs:

1. Add a new API endpoint in server-proxy.js
2. Implement the API-specific logic
3. Update the client-side code to use the new endpoint

## Security Considerations

- API keys are stored securely on the server
- Input validation is implemented to prevent misuse
- Rate limiting should be considered for production use
- All communication uses HTTPS in production

## Support

For questions or issues, please contact Jackson Hedge.
