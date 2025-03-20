# Google Drive Integration for TipEnter

This document provides instructions for setting up and testing the Google Drive integration for TipEnter.

## Overview

The Google Drive integration allows TipEnter to:

1. Automatically monitor a Google Drive folder for new receipt images
2. Process these images in real-time or in scheduled batches
3. Mark files as processed to avoid duplicate processing
4. Import receipt data directly into the TipEnter application

## Setup

### Prerequisites

- Node.js 14 or higher
- npm or yarn
- A Google Cloud Platform account
- A Google Drive folder for storing receipt images

### Installation

1. Install the required dependencies:

```bash
npm install
```

2. Configure your environment variables in the `.env` file:

```
GOOGLE_CLIENT_EMAIL=1028385682352-compute@developer.gserviceaccount.com
GOOGLE_PRIVATE_KEY=AIzaSyB2iNWpaTSv_SqDBTpSTaSRdpONLuF9t7o
GOOGLE_DRIVE_FOLDER_ID=1s1lUWAZb8PqD-T8wgmzT-jTaPTBTHLUq
```

3. Make sure the Google Drive API is enabled in your Google Cloud Console.

4. Ensure the redirect URI is set to `https://tipenters.com/oauth2callback` in your OAuth credentials.

## Testing the Integration

We've provided several scripts to test different aspects of the Google Drive integration:

### 1. Basic Testing

Run the test script to check if the integration is working properly:

```bash
npm run test:drive
```

This script will:
- Connect to your Google Drive account
- List all files in the specified folder
- Check for unprocessed files
- Mark a file as processed (for testing purposes)

### 2. Real-time Monitoring

To test real-time monitoring of the Google Drive folder:

```bash
npm run monitor:drive
```

This script will:
- Start monitoring your Google Drive folder
- Check for new files every 30 seconds
- Process new files as they are added
- Log all activities to the console and a log file

To test this:
1. Start the monitoring script
2. Upload a new image to your Google Drive folder
3. Watch as the script detects and processes the new file

### 3. Batch Processing

To test batch processing at scheduled intervals:

```bash
npm run batch:drive
```

This script will:
- Schedule batch processing every hour and daily at midnight
- Process all unprocessed files in batches
- Keep a history of batch processing activities

For immediate testing:

```bash
npm run batch:drive:test
```

This will run a batch process immediately without waiting for the scheduled time.

## Logs

All logs are stored in the `logs` directory:

- `drive-monitor.log`: Logs from real-time monitoring
- `batch-process.log`: Logs from batch processing
- Batch result files: JSON files with details of each batch process

## Troubleshooting

If you encounter issues with the Google Drive integration:

1. Check the log files for error messages
2. Verify your Google Cloud credentials are correct
3. Ensure the Google Drive API is enabled
4. Check that your service account has access to the specified folder
5. Verify the folder ID is correct

## Integration with TipEnter

The Google Drive integration is automatically initialized when you start the TipEnter application:

```bash
npm start
```

This will:
- Start the TipEnter web application
- Initialize the Google Drive service
- Begin monitoring for new files
- Process files according to the configured schedule

You can also view the Google Drive status in the TipEnter web interface.
