#!/bin/bash

# Script to push privacy policy changes to GitHub
echo "Pushing privacy policy changes to GitHub..."

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
git add privacy/index.html landing.html

# Commit the changes
git commit -m "Add privacy policy page at /privacy/ and update landing page footer link"

# Push to GitHub
git push -u origin main

echo "Privacy policy successfully pushed to production!"
