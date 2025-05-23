# MCP Server Configuration

This project uses the Model Context Protocol (MCP) to extend the capabilities of AI assistants. MCP servers provide tools and resources that can be used by AI assistants to perform specific tasks.

## Configuration

The MCP server configuration is stored in `.vscode/mcp.json`. This file defines the MCP servers that are available to the AI assistant.

### Current MCP Servers

1. **browsermcp** - Provides browser automation capabilities
   - Allows the AI to control a browser for testing web applications
   - Uses `@browsermcp/mcp` package

2. **supabase** - Provides access to Supabase services
   - Authentication
   - Database operations
   - Storage operations
   - Uses `@supabase/mcp` package (hypothetical)
   - Uses environment variables for configuration

3. **anthropic** - Provides access to Anthropic/Claude AI services
   - Uses `@anthropic/mcp` package (hypothetical)
   - Uses environment variables for configuration

## Environment Variables

To avoid hardcoding sensitive information like API keys, the MCP servers use environment variables. These variables are defined in the `.env` file and are referenced in the MCP configuration using the `${env:VARIABLE_NAME}` syntax.

### Required Environment Variables

- `SUPABASE_URL` - The URL of your Supabase project
- `SUPABASE_ANON_KEY` - The anonymous key for your Supabase project
- `ANTHROPIC_API_KEY` - Your Anthropic/Claude API key

## Adding a New MCP Server

To add a new MCP server:

1. Open the `.vscode/mcp.json` file
2. Add a new entry to the `mcpServers` object
3. Specify the `command` and `args` for the server
4. If the server requires environment variables, add them to the `env` object

Example:

```json
"new-server": {
  "command": "npx",
  "args": ["@example/mcp@latest"],
  "env": {
    "API_KEY": "${env:EXAMPLE_API_KEY}"
  }
}
```

## Browser Environment Variables

For browser-based applications, environment variables are not directly accessible. This project includes a system to make environment variables available to browser code:

1. `js/config.js` - Centralizes configuration and provides fallbacks
2. `js/env-loader.js` - Loads environment variables in the browser
3. `generate-env-js.js` - Generates a `js/env.js` file from `.env` (for development only)

### Using Environment Variables in Browser Code

```javascript
import { SUPABASE_CONFIG } from '../config.js';

// Use configuration values
const supabaseUrl = SUPABASE_CONFIG.URL;
const supabaseKey = SUPABASE_CONFIG.ANON_KEY;
```

## Security Considerations

- Never commit sensitive information like API keys to version control
- The `js/env.js` file is excluded from version control via `.gitignore`
- Only non-sensitive environment variables should be exposed to the browser
- In production, sensitive operations should be handled server-side

## Generating Browser Environment Variables

For development, you can generate the `js/env.js` file from your `.env` file:

```bash
node generate-env-js.js
```

This will create a `js/env.js` file with safe environment variables that can be loaded in the browser.
