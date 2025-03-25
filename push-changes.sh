#!/bin/bash

# Configure Git
git config --global user.email "user@example.com"
git config --global user.name "Claude User"

# Add the modified files
git add js/services/googleDriveServerService.js test-google-drive.js monitor-google-drive.js batch-process-google-drive.js

# Commit the changes
git commit -m "Fix Google Drive integration to handle different private key formats"

# Push to GitHub
# Note: This will prompt for GitHub username and password/token
git push -u origin master

echo "Push completed. Check the output above for any errors."
