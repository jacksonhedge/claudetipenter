# Deploying the Privacy Policy to Koyeb

Follow these steps to deploy the privacy policy to your production server on Koyeb:

## Step 1: Deploy the Updated Code

1. Log in to your [Koyeb Control Panel](https://app.koyeb.com/)

2. Navigate to your TipEnters application

3. Start a new deployment by clicking "Deploy" or "Redeploy"

4. Ensure Koyeb is pulling the latest code from your GitHub repository
   - Since we just pushed the changes to GitHub, Koyeb should pull the updated code
   - This includes the new privacy policy page and landing page updates

5. If you need to manually trigger a new build:
   - Go to the Settings tab for your app
   - Find the GitHub integration section
   - Click "Sync" or "Rebuild" to force a new build

## Step 2: Check Your Route Configuration

Make sure your Koyeb app is configured to serve static files correctly:

- Verify that your Express.js configuration in `server.js` is serving static files from the root directory
- The `app.use(express.static(__dirname))` line should already handle this
- This will ensure the `/privacy/` directory is accessible

## Step 3: Verify the Deployment

After deployment completes:

1. Wait for Koyeb to indicate the deployment is complete and healthy

2. Visit your production website (e.g., `https://tipenters.com/privacy/`)

3. Confirm the privacy policy page loads correctly

4. Check that the link in the footer of your landing page works

## Optional: Set Up the Subdomain

If you want to also make the privacy policy available on a dedicated subdomain:

1. In Koyeb, navigate to your app's "Domains" section

2. Add a new custom domain: `privacy.tipenters.com`

3. Configure DNS at your domain registrar by adding a CNAME record:
   - Name/Host: `privacy`
   - Value/Target: Your Koyeb app's domain name (e.g., `your-app.koyeb.app`)

4. Deploy the modified `server-privacy-subdomain.js` instead of the regular `server.js` to enable subdomain routing
   - Update your Koyeb service configuration to use this file as the entry point

5. Wait for DNS to propagate (can take up to 24-48 hours)

6. Test by visiting `https://privacy.tipenters.com`

## Troubleshooting

If the privacy policy doesn't appear:

1. Check Koyeb logs for any errors

2. Verify the file structure - the privacy policy should be at `/privacy/index.html` in your repo

3. Ensure your server is properly configured to serve static files

4. Try restarting the service if necessary
