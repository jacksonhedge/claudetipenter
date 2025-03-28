# Image Enhancer for TipEnter

This module adds an image enhancement capability to TipEnter using the IntSig SDK. It provides automatic document enhancement, border detection, and optimization for receipt images.

## Features

- Receipt image enhancement for better readability and OCR accuracy
- Document border detection
- Multiple enhancement modes (Auto, Document, Photo)
- Adjustable output resolution
- Before/After comparison slider
- Batch processing capabilities

## Setup

### Prerequisites

- Node.js 14.x or higher
- IntSig SDK (or CLI tool) installed on the server

### Environment Variables

Add the following environment variables to your `.env` file:

```
INTSIG_APP_KEY=your_app_key_here
INTSIG_SUB_APP_KEY=your_sub_app_key_here
```

You can obtain these keys by signing up for the IntSig OCR service.

### Installation

1. Install the required dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. Access the image enhancer at:
   ```
   http://localhost:3000/enhancer.html
   ```

## Usage

1. **Upload Images**: Drag and drop images or use the file browser to select receipt images for enhancement.

2. **Configure Settings**: Select the enhancement mode and output resolution.
   - **Auto Mode**: Automatically detects and applies the best enhancement settings.
   - **Document Mode**: Optimized for paper documents with text.
   - **Photo Mode**: Preserves color and details in photographic content.

3. **Process Images**: Click "Enhance Images" to start processing.

4. **View Results**: Use the comparison slider to see before/after results.

## API Endpoints

### POST /api/enhance-image

Enhances an image using the IntSig SDK.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `image`: Image file (required)
  - `enhanceMode`: Enhancement mode - 'auto', 'document', or 'photo' (optional, default: 'auto')
  - `maxSize`: Maximum dimension for output image (optional, default: 1600)

**Response:**
```json
{
  "originalImage": "/uploads/original/filename.jpg",
  "enhancedImage": "/uploads/enhanced/filename.jpg",
  "borderPoints": [
    {"x": 10, "y": 10},
    {"x": 10, "y": 290},
    {"x": 390, "y": 290},
    {"x": 390, "y": 10}
  ]
}
```

## Integration with TipEnter

The image enhancer is designed to improve receipt image quality before OCR processing. Enhanced images can then be sent to Claude API for more accurate text extraction and data processing.

## Technical Details

The enhancer uses a server-side implementation that bridges the web application with the IntSig SDK. It handles:

1. Image upload and temporary storage
2. Communication with the IntSig SDK for enhancement
3. Border point detection and extraction
4. Image optimization
5. Before/after comparison display

## Troubleshooting

If you encounter issues with image enhancement:

1. Check that the IntSig SDK is properly installed and accessible to the server
2. Verify your API keys are correct in the .env file
3. Ensure the uploads directory is writable by the server
4. Check server logs for specific error details

## License

This feature is part of the TipEnter application and is subject to the same licensing terms.
