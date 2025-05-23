/**
 * Environment Variable Loader for Browser
 * 
 * This script creates a global ENV object in the browser that contains
 * non-sensitive environment variables. For security reasons, sensitive
 * variables like API keys should be handled server-side and not exposed
 * to the client directly in production.
 * 
 * In development, this script can load values from a .env.js file which
 * should be generated from the .env file but excluded from version control.
 */

// Create global ENV object
window.ENV = window.ENV || {};

// Function to load environment variables from .env.js if available
function loadEnvironmentVariables() {
  // In production, environment variables should be injected by the server
  // or a build process, not loaded from a file
  
  // For development, try to load from .env.js if it exists
  const envScript = document.createElement('script');
  envScript.src = '/js/env.js'; // This file should be generated from .env
  envScript.onerror = () => {
    console.warn('Environment variables file not found. Using defaults from config.js');
  };
  document.head.appendChild(envScript);
}

// Load environment variables
loadEnvironmentVariables();

// Log environment mode
console.log(`Environment: ${window.ENV.NODE_ENV || 'development'}`);
