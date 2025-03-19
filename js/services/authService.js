/**
 * Authentication Service
 * Handles authentication with POS systems and user management
 */

/**
 * POS system configurations for authentication
 */
const POS_AUTH_CONFIGS = {
    lightspeed: {
        name: 'Lightspeed',
        authUrl: 'https://cloud.lightspeedapp.com/oauth/authorize',
        tokenUrl: 'https://cloud.lightspeedapp.com/oauth/access_token',
        clientId: 'your-lightspeed-client-id', // Replace with your actual client ID
        redirectUri: window.location.origin + '/auth/lightspeed/callback',
        scope: 'employee:all',
        responseType: 'code'
    },
    square: {
        name: 'Square',
        authUrl: 'https://connect.squareup.com/oauth2/authorize',
        tokenUrl: 'https://connect.squareup.com/oauth2/token',
        clientId: 'your-square-client-id', // Replace with your actual client ID
        redirectUri: window.location.origin + '/auth/square/callback',
        scope: 'MERCHANT_PROFILE_READ EMPLOYEES_READ TIMECARDS_READ',
        responseType: 'code'
    },
    toast: {
        name: 'Toast',
        authUrl: 'https://api.toasttab.com/authentication/v1/authentication/login_redirect',
        tokenUrl: 'https://api.toasttab.com/authentication/v1/authentication/token',
        clientId: 'your-toast-client-id', // Replace with your actual client ID
        redirectUri: window.location.origin + '/auth/toast/callback',
        scope: 'employees.read orders.read',
        responseType: 'code'
    },
    harbortouch: {
        name: 'Harbortouch',
        authUrl: 'https://api.harbortouch.com/oauth/authorize',
        tokenUrl: 'https://api.harbortouch.com/oauth/token',
        clientId: 'your-harbortouch-client-id', // Replace with your actual client ID
        redirectUri: window.location.origin + '/auth/harbortouch/callback',
        scope: 'read_employees read_orders',
        responseType: 'code'
    },
    revel: {
        name: 'Revel Systems',
        authUrl: 'https://api.revelup.com/oauth/authorize',
        tokenUrl: 'https://api.revelup.com/oauth/token',
        clientId: 'your-revel-client-id', // Replace with your actual client ID
        redirectUri: window.location.origin + '/auth/revel/callback',
        scope: 'read_employees read_orders',
        responseType: 'code'
    },
    clover: {
        name: 'Clover',
        authUrl: 'https://sandbox.dev.clover.com/oauth/authorize',
        tokenUrl: 'https://sandbox.dev.clover.com/oauth/token',
        clientId: 'your-clover-client-id', // Replace with your actual client ID
        redirectUri: window.location.origin + '/auth/clover/callback',
        scope: 'EMPLOYEES_READ ORDERS_READ',
        responseType: 'code'
    },
    shopify: {
        name: 'Shopify',
        authUrl: 'https://your-store.myshopify.com/admin/oauth/authorize',
        tokenUrl: 'https://your-store.myshopify.com/admin/oauth/access_token',
        clientId: 'your-shopify-client-id', // Replace with your actual client ID
        redirectUri: window.location.origin + '/auth/shopify/callback',
        scope: 'read_orders,read_customers',
        responseType: 'code'
    },
    maxxpay: {
        name: 'MaxxPay',
        authUrl: 'https://api.maxxpay.com/oauth/authorize',
        tokenUrl: 'https://api.maxxpay.com/oauth/token',
        clientId: 'your-maxxpay-client-id', // Replace with your actual client ID
        redirectUri: window.location.origin + '/auth/maxxpay/callback',
        scope: 'read_employees read_orders',
        responseType: 'code'
    }
};

/**
 * Get the authentication URL for a POS system
 * @param {string} provider - The POS system provider (e.g., 'lightspeed')
 * @param {boolean} isSignup - Whether this is for signup or login
 * @returns {string} - The authentication URL
 */
export function getAuthUrl(provider, isSignup = false) {
    if (!POS_AUTH_CONFIGS[provider]) {
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    const config = POS_AUTH_CONFIGS[provider];
    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: config.scope,
        response_type: config.responseType,
        state: JSON.stringify({ action: isSignup ? 'signup' : 'login' })
    });
    
    return `${config.authUrl}?${params.toString()}`;
}

/**
 * Check if the user is authenticated
 * @returns {boolean} - Whether the user is authenticated
 */
export function isAuthenticated() {
    return !!localStorage.getItem('auth_token');
}

/**
 * Get the current user
 * @returns {Object|null} - The current user or null if not authenticated
 */
export function getCurrentUser() {
    const userJson = localStorage.getItem('current_user');
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Login with email and password
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} - Promise resolving to the user object
 */
export async function login(email, password) {
    try {
        // In a real application, you would make an API call to your server
        // For demo purposes, we'll simulate a successful login
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate successful login
        const user = {
            id: '123',
            name: 'Demo User',
            email: email,
            role: 'user'
        };
        
        // Store auth token and user in localStorage
        localStorage.setItem('auth_token', 'demo_token');
        localStorage.setItem('current_user', JSON.stringify(user));
        
        return user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Sign up with email and password
 * @param {string} name - The user's name
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} - Promise resolving to the user object
 */
export async function signup(name, email, password) {
    try {
        // In a real application, you would make an API call to your server
        // For demo purposes, we'll simulate a successful signup
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate successful signup
        const user = {
            id: '123',
            name: name,
            email: email,
            role: 'user'
        };
        
        // Store auth token and user in localStorage
        localStorage.setItem('auth_token', 'demo_token');
        localStorage.setItem('current_user', JSON.stringify(user));
        
        return user;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

/**
 * Logout the current user
 */
export function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

/**
 * Authenticate with a POS provider
 * @param {string} provider - The provider to authenticate with
 * @param {boolean} isSignup - Whether this is a signup or login
 */
export function authenticateWithProvider(provider, isSignup = false) {
    try {
        const authUrl = getAuthUrl(provider, isSignup);
        
        // In a real application, you would redirect to the auth URL
        console.log(`Redirecting to ${authUrl}`);
        
        // For demo purposes, simulate a successful authentication
        setTimeout(() => {
            // Simulate successful authentication
            const user = {
                id: '123',
                name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
                email: `user@${provider}.com`,
                role: 'user',
                provider: provider
            };
            
            // Store auth token and user in localStorage
            localStorage.setItem('auth_token', 'demo_token');
            localStorage.setItem('current_user', JSON.stringify(user));
            
            // Redirect to main application
            window.location.href = 'index.html';
        }, 2000);
    } catch (error) {
        console.error(`Error authenticating with ${provider}:`, error);
        throw error;
    }
}

/**
 * Handle the authentication callback from a POS provider
 * @param {string} provider - The provider that redirected back
 * @param {string} code - The authorization code
 * @param {string} state - The state parameter
 * @returns {Promise<Object>} - Promise resolving to the user object
 */
export async function handleAuthCallback(provider, code, state) {
    try {
        if (!POS_AUTH_CONFIGS[provider]) {
            throw new Error(`Unknown provider: ${provider}`);
        }
        
        // Parse state to get action (signup or login)
        const stateObj = JSON.parse(state);
        const isSignup = stateObj.action === 'signup';
        
        // In a real application, you would exchange the code for an access token
        // For demo purposes, we'll simulate a successful authentication
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate successful authentication
        const user = {
            id: '123',
            name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
            email: `user@${provider}.com`,
            role: 'user',
            provider: provider
        };
        
        // Store auth token and user in localStorage
        localStorage.setItem('auth_token', 'demo_token');
        localStorage.setItem('current_user', JSON.stringify(user));
        
        return user;
    } catch (error) {
        console.error(`Error handling ${provider} callback:`, error);
        throw error;
    }
}
