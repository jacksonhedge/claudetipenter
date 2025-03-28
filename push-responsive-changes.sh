#!/bin/bash

# Script to push responsive layout changes to GitHub
echo "Pushing responsive layout changes to GitHub..."

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
git add css/style-fixes.css scanner.html enhanced-scanner.html

# Commit the changes
git commit -m "Improve: Enhanced mobile responsiveness for better display on iPhone"

# Push to GitHub
git push -u origin main

echo "Push completed!"
