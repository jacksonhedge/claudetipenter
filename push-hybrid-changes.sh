#!/bin/bash

# Configure Git
git config --global user.email "user@example.com"
git config --global user.name "Claude User"

# Add the modified file
git add hybrid-try-it-out.html

# Commit the changes
git commit -m "Fix UI issues in hybrid-try-it-out.html and implement Firing Line Mode"

# Push to GitHub
# Note: This will prompt for GitHub username and password/token
git push -u origin master

echo "Push completed. Check the output above for any errors."
