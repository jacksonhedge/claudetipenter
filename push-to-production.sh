#!/bin/bash

# Script to push all changes to production
echo "Pushing all changes to production..."

# Set environment variable to ensure real Anthropic API is used
export USE_MOCK_API=false

# Configure Git if needed
git config --global user.name "Claude"
git config --global user.email "claude@anthropic.com"

# Make sure we have the latest changes
git pull origin main

# Add all modified files
git add .

# Commit the changes
git commit -m "Production: Firing line mode with Anthropic API for all inputs"

# Push to GitHub
git push -u origin main

# Deploy to production server
echo "Deploying to production server..."

# Here you would add your actual deployment commands, for example:
# rsync -avz --exclude '.git' --exclude 'node_modules' . user@production-server:/path/to/production

echo "Production deployment completed!"
echo ""
echo "#### IMPORTANT NOTES ####"
echo "1. All image inputs now use the Anthropic API (mock mode disabled)"
echo "2. Firing line mode added to scanner.html and enhanced-scanner.html"
echo "3. Mobile responsiveness improved for iPhone/iPad devices"
echo ""
echo "Remember to update the API keys if needed on the production server."
