# Setting Up privacy.tipenters.com Subdomain

This guide explains how to set up a dedicated subdomain for your privacy policy at privacy.tipenters.com, using your existing GitHub repository and Koyeb deployment.

## 1. Configure DNS Settings

First, you need to create a CNAME record for the `privacy` subdomain in your DNS settings:

1. Go to your domain registrar where tipenters.com is registered (e.g., GoDaddy, Namecheap, etc.)
2. Access the DNS management section
3. Add a new CNAME record with these values:
   - **Type**: CNAME
   - **Host/Name**: `privacy`
   - **Value/Target**: Your Koyeb app domain (e.g., `yourapp.koyeb.app`) or your GitHub Pages URL if you're using that
   - **TTL**: 3600 (or default)

## 2. Configure Koyeb to Serve the Subdomain

### Option A: If using Koyeb's built-in custom domain feature:

1. Log in to your [Koyeb Control Panel](https://app.koyeb.com/)
2. Navigate to your app that serves the TipEnters website
3. Go to Settings > Domains
4. Add a new custom domain: `privacy.tipenters.com`
5. Follow any verification steps Koyeb requires

### Option B: Alternative approach with URL rewriting:

If your Koyeb app already serves content at paths like `/privacy/`, you can configure it to also respond to requests from the subdomain:

1. Add environment variables or configuration to your Koyeb app to detect requests from `privacy.tipenters.com`
2. When such requests are detected, serve the content from the privacy policy page

## 3. Ensure Your Application Handles the Subdomain

If using the Koyeb custom domain approach, you might need a "catch-all" route in your application to serve the privacy policy regardless of the path requested on the subdomain.

In your server or application code, add logic similar to:

```javascript
// Sample logic for server.js or other server code
if (req.hostname === 'privacy.tipenters.com') {
  // Serve the privacy policy content
  res.sendFile(path.join(__dirname, 'privacy/index.html'));
}
```

## 4. Update Links (Optional)

Once your subdomain is working, you might want to update links throughout your site to point to the new subdomain instead of the `/privacy/` path:

```html
<!-- Change from -->
<a href="/privacy/">Privacy Policy</a>

<!-- To -->
<a href="https://privacy.tipenters.com">Privacy Policy</a>
```

## 5. Verify Setup

After completing these steps:
1. Wait for DNS propagation (can take up to 24-48 hours, but often much faster)
2. Visit privacy.tipenters.com in your browser to confirm it displays your privacy policy
3. Test on different devices and networks to ensure it's accessible everywhere

## 6. SSL Certificate

Ensure your subdomain has a valid SSL certificate for HTTPS access. Koyeb typically handles this automatically when you add a custom domain, but double-check that https://privacy.tipenters.com works properly.

---

Note: The exact steps might vary slightly depending on your specific Koyeb setup and deployment configuration. If you encounter any issues, check Koyeb's documentation on [custom domains](https://www.koyeb.com/docs/run-apps/app-service-configuration#custom-domains) for more detailed guidance.
