# IntSig Image Processing Component

This module provides a front-end component for image processing, enhancement, and document capture capabilities.

## Overview

The IntSig Image Processor is a client-side library that offers document scanning, border detection, perspective correction, and image enhancement features. It provides a modern interface for handling document images and preparing them for further processing.

## Components

1. **IntSig Image Processor Library** (`js/intsig-image-processor.js`):
   - Core library with image processing capabilities
   - Document border detection
   - Perspective correction
   - Multiple enhancement modes
   - Manual border adjustment

2. **IntSig Image Processing Demo** (`intsig-image-processor.html`):
   - Complete web interface for testing the processor
   - Image upload with drag-and-drop support
   - Visual comparison of original and processed images
   - Enhancement mode selection
   - Download of processed images

## Getting Started

### Basic Implementation

```html
<!-- Include the library -->
<script src="js/intsig-image-processor.js"></script>

<script>
  // Initialize processor
  const processor = new IntSigImageProcessor({
    appKey: 'YOUR_API_KEY',
    defaultEnhanceMode: 'auto',
    maxOutputSize: 1600
  });
  
  // Initialize
  await processor.initialize();
  
  // Process an image
  const result = await processor.processImage(imageFile, {
    enhanceMode: 'magic',
    maxSize: 1600
  });
  
  // Use the result
  if (result.success) {
    const processedImage = result.result;
    // Do something with the processed image
  }
</script>
```

### Demo Application

To run the demo application:

1. Ensure the `js/intsig-image-processor.js` file is in the correct location
2. Open `intsig-image-processor.html` in a web browser
3. Upload an image using the interface
4. Try different enhancement modes
5. Download the processed result

## API Reference

### Constructor Options

```javascript
const processor = new IntSigImageProcessor({
  appKey: 'YOUR_API_KEY',               // API key for authentication
  maxOutputSize: 1600,                  // Maximum output dimension
  defaultEnhanceMode: 'auto',           // Default enhancement mode
  normalBorderColor: '#19BC9C',         // Border color
  errorBorderColor: '#E74C3C'           // Error border color
});
```

### Methods

#### `initialize(appKey)`

Initialize the processor with an optional API key.

```javascript
await processor.initialize('YOUR_API_KEY');
```

#### `processImage(imageSource, options)`

Process an image file or URL.

```javascript
const result = await processor.processImage(imageFile, {
  enhanceMode: 'magic',   // Enhancement mode
  maxSize: 1600           // Maximum output dimension
});
```

Enhancement modes:
- `'auto'`: Automatic enhancement
- `'original'`: No enhancement
- `'enhance'`: Standard enhancement
- `'magic'`: Enhanced with sharpening
- `'gray'`: Grayscale
- `'black_white'`: Black and white

#### `detectBorders(image)`

Detect document borders in an image.

```javascript
const borders = await processor.detectBorders(image);
// Returns array of corner points: [{x,y}, {x,y}, {x,y}, {x,y}]
```

#### `trimImage(image, borders, maxSize)`

Trim and correct perspective of an image using detected borders.

```javascript
const trimmedImage = await processor.trimImage(image, borders, 1600);
```

#### `enhanceImage(image, mode)`

Apply enhancement to an image.

```javascript
const enhancedImage = await processor.enhanceImage(image, 'magic');
```

#### `createImageEditView(container, image, borders)`

Create an interactive editor for adjusting document borders.

```javascript
const editor = processor.createImageEditView(containerElement, image, borders);
```

## Integration with TipEnter Proxy Server

This component is designed to work alongside the TipEnter proxy server for image processing. While the IntSig processor handles client-side image preparation, the proxy server can be used for server-side processing and API integration.

The workflow would be:
1. Use IntSig processor to capture and enhance the document image
2. Send the processed image to the TipEnter proxy server
3. The proxy server will extract data using Claude API
4. Display the extracted data to the user

## Browser Compatibility

The IntSig Image Processor requires modern browser features:
- Canvas API
- Drag and Drop API
- File API
- Promises and async/await

Supported browsers:
- Chrome 60+
- Firefox 60+
- Safari 11+
- Edge 79+
