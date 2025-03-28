# Development Server Guide for Image Upload API

This guide explains how to run and use the development server for the image upload functionality.

## Starting the Development Server

### Option 1: Standard Server (No Auto-Reload)

Run the server directly with Node:

```bash
node server-proxy.js
```

This will start the server at http://localhost:3000 (or the port specified in your `.env` file).

### Option 2: Development Server with Auto-Reload

For development with automatic reloading when files change:

1. First make sure you have nodemon installed:
   ```bash
   npm install -g nodemon
   ```

2. Then run the development server:
   ```bash
   npm run dev:proxy
   ```
   
   Or directly:
   ```bash
   nodemon server-proxy.js
   ```

This will start the server with auto-reload enabled, so any changes to the server code will automatically restart the server.

## Available Endpoints

The development server has the following endpoints:

- **Main Upload Endpoint**: http://localhost:3000/api/upload-image
- **Web Client Endpoint**: http://localhost:3000/api/process-receipt
- **Health Check**: http://localhost:3000/api/health
- **Testing UI**: http://localhost:3000/test-image-upload.html

## Development Workflow

1. Make changes to `server-proxy.js` or other relevant files
2. If using nodemon, the server will automatically restart
3. Test your changes using the test UI or through API calls
4. Check the server logs in the terminal for debugging information

## Environment Variables for Development

Key environment variables that affect development:

- `PORT`: The port the server runs on (default: 3000)
- `ANTHROPIC_API_KEY`: Your API key for Claude
- `CACHE_TTL`: Cache duration in seconds (default: 3600)
- `LOG_LEVEL`: Logging verbosity (default: 'info')

## Useful Development Commands

- Check server status: `curl http://localhost:3000/api/health`
- Stop the server: Press `Ctrl+C` in the terminal
- Restart the server manually: Kill and restart the node process
- Clear the uploads directory: `rm -rf uploads/*`

## Testing Your Changes

After making changes to the server, you can test them by:

1. Using the web UI at http://localhost:3000/test-image-upload.html
2. Making API requests with Postman or cURL
3. Checking the server logs for any errors or debug information

## Troubleshooting Development Issues

- **Port already in use**: Kill any existing Node processes and restart
  ```bash
  pkill -f "node server-proxy.js" && node server-proxy.js
  ```

- **Module not found errors**: Make sure all dependencies are installed
  ```bash
  npm install
  ```

- **API key errors**: Verify your `.env` file has a valid ANTHROPIC_API_KEY

- **Uploads directory missing**: The server will create it automatically, but you can create it manually:
  ```bash
  mkdir -p uploads
  ```
