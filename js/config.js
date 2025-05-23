/**
 * Configuration file for TipEnter application
 * 
 * This file centralizes configuration values and makes it easier to use
 * environment variables in browser-based JavaScript.
 * 
 * In a production environment, these values should be loaded from environment variables
 * or a secure configuration service, not hardcoded.
 */

// Supabase configuration
export const SUPABASE_CONFIG = {
  // Use environment variables if available (for MCP server usage)
  // Fall back to hardcoded values for browser usage
  URL: window.ENV?.SUPABASE_URL || 'https://gmysjdndtqwkjvrngnze.supabase.co',
  ANON_KEY: window.ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdteXNqZG5kdHF3a2p2cm5nbnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzI0MzEsImV4cCI6MjA1OTI0ODQzMX0.3NGSsqVFha767BLiNkbDuv_i_Tp2n_vpcQxVvDLseGM'
};

// Anthropic/Claude API configuration
export const ANTHROPIC_CONFIG = {
  API_KEY: window.ENV?.ANTHROPIC_API_KEY || window.ENV?.CLAUDE_API_KEY || ''
};

// Application configuration
export const APP_CONFIG = {
  SERVER_PORT: window.ENV?.PORT || 3000,
  CACHE_TTL: window.ENV?.CACHE_TTL || 3600,
  LOG_LEVEL: window.ENV?.LOG_LEVEL || 'info'
};

// Export a default configuration object
export default {
  supabase: SUPABASE_CONFIG,
  anthropic: ANTHROPIC_CONFIG,
  app: APP_CONFIG
};
