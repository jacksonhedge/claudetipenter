#!/bin/bash

# Script to push UI changes to GitHub
echo "Pushing UI changes to GitHub..."

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
git add css/modern-ui.css js/sidebar-profile.js login.html js/simple-login.js css/login.css assets/images/tipenter-logo.svg assets/favicon/favicon.svg scanner.html

# Commit the changes
git commit -m "UI Improvements: Added modern sidebar design with orange-yellow-red color scheme, profile section, logo, and renamed home.html to scanner.html"

# Push to GitHub
git push -u origin main

echo "Push completed!"
