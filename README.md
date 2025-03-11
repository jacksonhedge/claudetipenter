# Receipt/Check Data Extractor

A web application that uses Claude AI to extract structured data from handwritten receipts and checks.

## Features

- Upload 3-100 images of handwritten receipts or checks
- Drag and drop interface for easy file selection
- Image preview with the ability to remove unwanted files
- Progress tracking during processing
- JSON output display with copy-to-clipboard functionality
- Direct integration with Claude AI for accurate data extraction

## Extracted Fields

The application extracts the following fields from each receipt/check:

1. **date**: The date on the receipt/check
2. **time**: The time on the receipt/check
3. **customer_name**: The name of the customer
4. **check_number**: The check or receipt number
5. **amount**: The base amount (before tip)
6. **tip**: The handwritten tip amount
7. **total**: The adjusted total (amount + tip, also handwritten)
8. **signed**: A boolean (true/false) indicating if the receipt is signed

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Claude API key

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

4. Make sure your Claude API key is set in the `.env` file:

```
CLAUDE_API_KEY=your_claude_api_key_here
```

### Running the Application

1. Start the server:

```bash
npm start
```

2. Open your browser and navigate to:

```
http://localhost:3000
```

## How to Use

1. Upload images by either:
   - Dragging and dropping image files onto the drop area
   - Clicking the drop area and selecting files through the file dialog
2. Review your selected images in the file list
3. Click "Process Images" when you have selected between 3-100 images
4. Wait for the processing to complete
5. View the extracted data in JSON format
6. Use the "Copy JSON" button to copy the results to your clipboard

## Architecture

This application consists of two main parts:

1. **Frontend**: A web interface for uploading images and displaying results
   - HTML/CSS for the user interface
   - JavaScript for handling file uploads and displaying results

2. **Backend**: A Node.js server that handles API calls to Claude
   - Express.js for the web server
   - Axios for making HTTP requests to the Claude API
   - dotenv for loading environment variables

The frontend communicates with the backend through a REST API endpoint:
- `/api/process-images`: Accepts a POST request with base64-encoded images and returns the extracted data in JSON format

## Security Considerations

- The application uses environment variables to store the API key securely
- No images or extracted data are stored on the server (other than during API processing)
- For production use, consider adding additional security measures such as:
  - Rate limiting
  - Authentication
  - HTTPS

## Troubleshooting

### Common Issues

1. **API Key Error**: Make sure your Claude API key is correctly set in the `.env` file
2. **Image Upload Issues**: Ensure your images are in a supported format (JPEG, PNG, etc.)
3. **Server Connection Error**: Check that the server is running and accessible

### Logs

Check the server console for error messages and logs.

## License

This project is open source and available under the MIT License.
