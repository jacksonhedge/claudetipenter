# Testing the TipEnter Image Upload API

This guide provides step-by-step instructions for testing the `/api/upload-image` endpoint.

## Prerequisites

1. The server is running with a valid Anthropic API key in your `.env` file
2. You have some receipt images for testing

## Option 1: Testing Using the Web Interface

The simplest way to test is using the included web interface:

1. Start the server:
   ```bash
   node server-proxy.js
   ```

2. Open the test page in your browser:
   ```
   http://localhost:3000/test-image-upload.html
   ```

3. Use the file selector to choose a receipt image
4. Click "Upload and Process" button
5. View the JSON results that display on the page

## Option 2: Testing Using Postman

[Postman](https://www.postman.com/downloads/) provides a user-friendly interface for API testing:

1. Open Postman and create a new request
2. Set the request method to **POST**
3. Enter URL: `http://localhost:3000/api/upload-image`
4. In the **Body** tab:
   - Select **form-data**
   - Add a key named `image` and set its type to **File**
   - Select a receipt image file from your computer
5. Click **Send** to make the request
6. View the JSON response in the lower panel

## Option 3: Testing Using cURL

For command-line testing:

```bash
curl -X POST http://localhost:3000/api/upload-image \
  -F "image=@/path/to/your/receipt.jpg" \
  -H "Content-Type: multipart/form-data"
```

Replace `/path/to/your/receipt.jpg` with the actual path to a test image.

## Example Response

A successful API response will look like:

```json
{
  "success": true,
  "model": "claude-3-haiku",
  "result": {
    "customer_name": "Starbucks",
    "date": "03/15/2025",
    "time": "2:34 PM",
    "check_number": "1234",
    "amount": "$4.95",
    "tip": "$1.00",
    "total": "$5.95",
    "payment_type": "Credit Card",
    "signed": "yes"
  }
}
```

## Debugging Common Issues

### 1. Missing API Key Error

```json
{
  "success": false,
  "error": "The Anthropic API key is missing or invalid"
}
```

**Solution**: Add a valid ANTHROPIC_API_KEY to your `.env` file.

### 2. Image Upload Errors

```json
{
  "success": false,
  "error": "No image file uploaded"
}
```

**Solution**: Make sure you're sending a file in the request using the field name `image`.

### 3. Server Not Running

If you can't connect to the endpoint, make sure the server is running with:

```bash
node server-proxy.js
```

Look for output: `Server proxy running at http://localhost:3000`

### 4. API Limits/Timeout

```json
{
  "success": false,
  "error": "Request timed out"
}
```

**Solution**: The Anthropic API may have rate limits or be experiencing issues. Try again later or check your API quota.
