# Deployment and Testing Guide for TipEnter Image Proxy Server

This guide explains how to run, test, and deploy the TipEnter Image Proxy Server.

## Local Development and Testing

### Running the Server Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. Start the server:
   ```bash
   npm run start:proxy
   ```

   Or for development with auto-reloading:
   ```bash
   npm run dev:proxy
   ```

4. The server will be available at:
   - Main URL: http://localhost:3000
   - Upload endpoint: http://localhost:3000/api/upload-image
   - Health check: http://localhost:3000/api/health

### Testing with the Web Interface

For visual testing of the image processing functionality:

1. With the server running, open the test UI in your browser:
   ```
   http://localhost:3000/test-image-upload.html
   ```

2. Use the file selector to choose a receipt image
3. Click "Upload and Process" to see the extracted data

## Deployment Options

### Option 1: Deploy to Heroku

1. Create a Heroku account if you don't have one
2. Install the Heroku CLI and login:
   ```bash
   npm install -g heroku
   heroku login
   ```

3. Create a new Heroku app:
   ```bash
   heroku create tipenter-proxy
   ```

4. Add your Anthropic API key as a config variable:
   ```bash
   heroku config:set ANTHROPIC_API_KEY=your_api_key_here
   ```

5. Push your code to Heroku:
   ```bash
   git push heroku main
   ```

### Option 2: Deploy to Railway

Railway is a modern PaaS that makes deployment extremely easy:

1. Create an account at [Railway](https://railway.app/)
2. Install Railway CLI or use their GitHub integration
3. Create a new project and deploy your repository
4. Add your ANTHROPIC_API_KEY as an environment variable
5. Railway will automatically build and deploy your app

### Option 3: Deploy to AWS Elastic Beanstalk

For more control and scalability:

1. Create an AWS account
2. Install the AWS EB CLI:
   ```bash
   pip install awsebcli
   ```

3. Initialize your EB project:
   ```bash
   eb init
   ```

4. Create an environment:
   ```bash
   eb create tipenter-proxy-env
   ```

5. Set environment variables:
   ```bash
   eb setenv ANTHROPIC_API_KEY=your_api_key_here
   ```

6. Deploy:
   ```bash
   eb deploy
   ```

## Testing the API Endpoints

### Using cURL

Test the health check endpoint:
```bash
curl http://localhost:3000/api/health
```

Test the image upload endpoint (replace path/to/receipt.jpg with an actual image path):
```bash
curl -X POST http://localhost:3000/api/upload-image \
  -F "image=@path/to/receipt.jpg" \
  -H "Content-Type: multipart/form-data"
```

### Using Postman

1. Download and install [Postman](https://www.postman.com/downloads/)
2. Create a new request:
   - Set method to POST
   - URL: http://localhost:3000/api/upload-image
   - In the Body tab, select "form-data"
   - Add a key "image" of type "File" and select a receipt image

3. Send the request to see the response

## Production Considerations

When moving to production, consider:

1. **SSL/HTTPS**: Use a secure connection (required for production use)
2. **Authentication**: Add API key or OAuth authentication 
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Monitoring**: Add services like Sentry or New Relic for monitoring
5. **Scaling**: Consider using a process manager like PM2 or container orchestration

## iOS App Testing

To test with your iOS app:

1. Update the URL in your Swift implementation to point to your server:
   ```swift
   let url = URL(string: "https://your-server-url.com/api/upload-image")!
   ```

2. If testing locally with an iOS simulator, use:
   ```swift
   let url = URL(string: "http://localhost:3000/api/upload-image")!
   ```

3. If testing locally with a physical device, use your computer's IP address:
   ```swift
   let url = URL(string: "http://192.168.x.x:3000/api/upload-image")!
   ```

## Troubleshooting Tips

1. **Check server logs**: If you encounter issues, the server logs will provide detailed error information.

2. **Verify API key**: If images aren't being processed, check that your ANTHROPIC_API_KEY is valid and has sufficient credits.

3. **Network issues**: If testing on a local network with iOS devices, make sure your computer firewall allows incoming connections on port 3000.

4. **Disk space**: The server temporarily stores uploaded images. Ensure you have sufficient disk space.

5. **Restart server**: If the server becomes unresponsive, simply restart it with:
   ```bash
   pkill -f "node server-proxy.js" && node server-proxy.js
   ```
