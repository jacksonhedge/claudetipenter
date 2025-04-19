#!/bin/bash

# Script to deploy privacy policy subdomain to Koyeb
echo "Deploying privacy policy subdomain setup..."

# Step 1: Push changes to GitHub
echo "Pushing changes to GitHub repository..."

# Configure Git if needed
git config --global user.name "Claude"
git config --global user.email "claude@anthropic.com"

# Make sure we have the right remote URL
git remote set-url origin https://github.com/jacksonhedge/claudetipenter.git

# Add our modified files
git add privacy/index.html landing.html server-privacy-subdomain.js SUBDOMAIN_SETUP.md

# Commit the changes
git commit -m "Add privacy policy with subdomain support at privacy.tipenters.com"

# Push to GitHub
git push -u origin main

# Step 2: Deploy to Koyeb
echo "Updating Koyeb deployment..."
echo "To deploy to Koyeb, follow these steps:"
echo "1. Log in to your Koyeb dashboard: https://app.koyeb.com/"
echo "2. Go to your TipEnters app"
echo "3. Create a new service or update the existing one:"
echo "   - Set the entry point to: server-privacy-subdomain.js"
echo "   - Environment variables should include your existing variables"
echo "4. Add a custom domain in the Domains section:"
echo "   - Domain: privacy.tipenters.com"
echo "5. Deploy the changes"

# Step 3: Configure DNS
echo ""
echo "DNS Configuration:"
echo "Once Koyeb deployment is complete, you'll need to add a CNAME record for privacy.tipenters.com"
echo "1. Go to your domain registrar's DNS management"
echo "2. Add a CNAME record:"
echo "   - Type: CNAME"
echo "   - Host: privacy"
echo "   - Value: [your-koyeb-app].koyeb.app"
echo "   - TTL: 3600 (or recommended value)"

echo ""
echo "Deployment preparation complete!"
echo "Follow the instructions above to complete the deployment on Koyeb and set up DNS."
echo "Once DNS propagates, your privacy policy will be available at https://privacy.tipenters.com"
