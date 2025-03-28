# TipEnter Image Processing Proxy

This document provides information about the TipEnter proxy server that handles image processing for both web and iOS app clients.

## Overview

The proxy server provides two main endpoints:

1. `/api/process-receipt` - For web clients (Base64 encoded image)
2. `/api/upload-image` - For iOS app clients (Multipart form data)

Both endpoints use Claude API to analyze receipt images and extract structured data including tip amounts, total values, dates, and more.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- An Anthropic API key (Claude)

### Installation

1. Make sure you have installed all dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with your Claude API key:

```
CLAUDE_API_KEY=your_api_key_here
```

3. Start the proxy server:

```bash
npm run start:proxy
```

For development with auto-reloading:

```bash
npm run dev:proxy
```

The server will run on port 3000 by default, or you can set a custom port with the `PORT` environment variable.

## API Endpoints

### Web Client Endpoint (Base64)

**URL:** `/api/process-receipt`

**Method:** `POST`

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "image": "base64_encoded_image_data",
  "filename": "optional_filename.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "model": "claude-3-opus",
  "result": {
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
}
```

### iOS App Endpoint (Multipart Form)

**URL:** `/api/upload-image`

**Method:** `POST`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `image`: The image file

**Response:**

```json
{
  "success": true,
  "model": "claude-3-haiku",
  "result": {
    "customer_name": "John Doe",
    "date": "03/25/2025",
    "time": "7:30 PM",
    "check_number": "#1234",
    "amount": "$45.67",
    "tip": "$9.13",
    "total": "$54.80",
    "payment_type": "Credit Card",
    "signed": "yes"
  }
}
```

### Health Check Endpoint

**URL:** `/api/health`

**Method:** `GET`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-03-27T17:49:35.123Z"
}
```

### Receipts Endpoint (Placeholder)

**URL:** `/api/receipts`

**Method:** `GET`

**Response:**

```json
{
  "receipts": []
}
```

This endpoint is currently a placeholder for future implementation of receipt storage and retrieval.

## iOS App Integration

To integrate with your iOS app, use the following Swift code:

```swift
import UIKit

func uploadImage(_ image: UIImage) {
    // Convert image to data
    guard let imageData = image.jpegData(compressionQuality: 0.8) else {
        print("Failed to convert image to data")
        return
    }
    
    // Create URL request
    let url = URL(string: "http://your-server:3000/api/upload-image")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    
    // Generate boundary string
    let boundary = "Boundary-\(UUID().uuidString)"
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    
    // Create body
    var body = Data()
    
    // Add image data
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
    body.append(imageData)
    body.append("\r\n".data(using: .utf8)!)
    
    // End boundary
    body.append("--\(boundary)--\r\n".data(using: .utf8)!)
    
    // Set body
    request.httpBody = body
    
    // Create task
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            print("Error: \(error)")
            return
        }
        
        guard let data = data else {
            print("No data received")
            return
        }
        
        do {
            if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
                print("Response: \(json)")
                
                // Handle the parsed receipt data here
                if let success = json["success"] as? Bool, success {
                    if let result = json["result"] as? [String: Any] {
                        // Use the extracted data
                        let amount = result["amount"] as? String ?? "unknown"
                        let tip = result["tip"] as? String ?? "unknown"
                        print("Amount: \(amount), Tip: \(tip)")
                        
                        // Update UI on main thread
                        DispatchQueue.main.async {
                            // Update your UI with the results
                        }
                    }
                }
            }
        } catch {
            print("JSON parsing error: \(error)")
        }
    }
    
    task.resume()
}
```

## Testing

You can test the image upload functionality using the included test page:

1. Start the proxy server: `npm run start:proxy`
2. Open `test-image-upload.html` in your browser
3. Select an image file
4. Click "Upload and Process"

The processing results will be displayed in JSON format.

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Missing image or invalid format
- `500 Internal Server Error`: Server-side processing error

Error responses include details about what went wrong:

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Deployment Considerations

When deploying to production:

1. Set up HTTPS with a valid SSL certificate
2. Configure proper CORS settings for your domains
3. Implement rate limiting for API endpoints
4. Consider adding authentication to protect the API
5. Set proper file size limits for uploaded images (currently 10MB)

## Technical Details

The server:
- Uses multer for handling multipart/form-data uploads
- Stores uploaded files temporarily and cleans them up after processing
- Optimizes images with Sharp before processing (resizing and compression)
- Uses the Anthropic Claude API to extract data from receipt images
- Implements caching to reduce API calls and improve performance
- Provides automatic retry with exponential backoff for failed API requests
- Implements proper error handling middleware for robust production use
- Provides health check endpoint for monitoring
- Includes an extensible architecture for future database integration
- Supports both JPEG and PNG image formats
- Has a 10MB file size limit

### Image Optimization

The server automatically optimizes uploaded images using the Sharp library before sending them to the Claude API. This optimization:

1. Resizes large images to a maximum of 1600x2000 pixels (maintaining aspect ratio)
2. Compresses the image to 80% quality JPEG
3. Improves processing speed and accuracy
4. Reduces bandwidth usage and API costs

### Caching and Retry Logic

The server includes intelligent caching and retry logic:

1. **MD5 Content Hashing**: Each image is hashed based on its content, allowing duplicate receipts to be recognized even with different filenames.
2. **In-Memory Cache**: Results are stored in an in-memory cache with a 1-hour TTL to reduce redundant API calls.
3. **Automatic Retry**: Failed API calls are automatically retried up to 3 times with exponential backoff (1s, 2s, 4s).
4. **Targeted Retries**: Only certain error types trigger retries (rate limits and server errors).

### API Models

The server uses different Claude models for different endpoints to balance speed and accuracy:

- `/api/process-receipt` (Web): Uses Claude-3-Opus for highest accuracy
- `/api/upload-image` (iOS): Uses Claude-3-Haiku for faster processing

## Troubleshooting

Common issues:

- **CORS errors**: Make sure your client app is properly handling CORS
- **Large file uploads**: Check that your image is under the 10MB limit
- **API timeout**: Processing large images may take time, consider adding a longer timeout
- **Claude API errors**: Verify your API key is valid and has sufficient credits

For any other issues, check the server logs for detailed error messages.
