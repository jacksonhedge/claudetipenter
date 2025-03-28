#!/bin/bash

# Script to push firing line mode changes to GitHub
echo "Pushing firing line mode changes to GitHub..."

# Configure Git if needed
git config --global user.name "Claude"
git config --global user.email "claude@anthropic.com"

# Check if repository is already initialized
if [ ! -d ".git" ]; then
  echo "Initializing Git repository..."
  git init
  git remote add origin https://github.com/jacksonhedge/claudetipenter.git
else
  echo "Git repository already initialized."
  # Make sure we have the right remote URL
  git remote set-url origin https://github.com/jacksonhedge/claudetipenter.git
fi

# Add our modified files
git add enhanced-scanner.html js/enhancedPhoneScanner-init.js scanner.html js/scanner-multi-photo.js

# Commit the changes
git commit -m "Feature: Added firing line mode to scanner and enhanced-scanner pages for rapid receipt capture"

# Push to GitHub
git push -u origin main

echo "Push completed!"
