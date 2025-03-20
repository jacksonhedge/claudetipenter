/**
 * Login Page JavaScript
 * Handles login/signup tabs and SSO functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // DOM Elements - Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    // DOM Elements - SSO
    const moreOptionsBtn = document.querySelectorAll('.more-options-btn');
    const ssoModal = document.getElementById('sso-modal');
    const ssoClose = document.querySelector('.sso-close');
    const ssoBtns = document.querySelectorAll('.sso-btn:not(.more-options-btn)');
    const ssoGridBtns = document.querySelectorAll('.sso-grid-btn');
    
    // Tab Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and panels
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const email = loginForm.querySelector('input[name="email"]').value;
            const password = loginForm.querySelector('input[name="password"]').value;
            
            // Validate form data
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            // In a real application, you would send this data to a server
            console.log('Login form submitted:', { email, password });
            
            // For demo purposes, redirect to the main application
            window.location.href = 'home.html';
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const name = signupForm.querySelector('input[name="name"]').value;
            const email = signupForm.querySelector('input[name="email"]').value;
            const password = signupForm.querySelector('input[name="password"]').value;
            const confirm = signupForm.querySelector('input[name="confirm"]').value;
            
            // Validate form data
            if (!name || !email || !password || !confirm) {
                alert('Please fill in all fields');
                return;
            }
            
            if (password !== confirm) {
                alert('Passwords do not match');
                return;
            }
            
            // In a real application, you would send this data to a server
            console.log('Signup form submitted:', { name, email, password });
            
            // For demo purposes, redirect to the main application
            window.location.href = 'home.html';
        });
    }
    
    // SSO Modal
    moreOptionsBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            ssoModal.style.display = 'block';
        });
    });
    
    if (ssoClose) {
        ssoClose.addEventListener('click', () => {
            ssoModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === ssoModal) {
            ssoModal.style.display = 'none';
        }
    });
    
    // SSO Button Click Handlers
    ssoBtns.forEach(btn => {
        btn.addEventListener('click', handleSsoClick);
    });
    
    ssoGridBtns.forEach(btn => {
        btn.addEventListener('click', handleSsoClick);
    });
    
    /**
     * Handle SSO button click
     * @param {Event} e - The click event
     */
    function handleSsoClick(e) {
        // Get the provider from the button class
        const classes = e.currentTarget.classList;
        let provider = '';
        
        if (classes.contains('lightspeed-btn')) {
            provider = 'lightspeed';
        } else if (classes.contains('square-btn')) {
            provider = 'square';
        } else if (classes.contains('toast-btn')) {
            provider = 'toast';
        } else if (classes.contains('harbortouch-btn')) {
            provider = 'harbortouch';
        } else if (classes.contains('revel-btn')) {
            provider = 'revel';
        } else if (classes.contains('clover-btn')) {
            provider = 'clover';
        } else if (classes.contains('shopify-btn')) {
            provider = 'shopify';
        } else if (classes.contains('maxxpay-btn')) {
            provider = 'maxxpay';
        }
        
        if (provider) {
            // In a real application, you would redirect to the SSO provider's auth page
            console.log(`Authenticating with ${provider}...`);
            
            // For demo purposes, simulate a loading state
            const originalText = e.currentTarget.innerHTML;
            const isSignup = document.getElementById('signup-tab').classList.contains('active');
            const action = isSignup ? 'Signing up' : 'Logging in';
            
            e.currentTarget.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${action}...</span>`;
            e.currentTarget.disabled = true;
            
            // Simulate authentication delay
            setTimeout(() => {
                // For demo purposes, redirect to the main application
                window.location.href = 'home.html';
            }, 2000);
        }
    }
    
    // Add authentication service for each POS provider
    const authServices = {
        lightspeed: {
            name: 'Lightspeed',
            authUrl: '/api/auth/lightspeed',
            icon: 'fa-bolt',
            color: '#f39c12'
        },
        square: {
            name: 'Square',
            authUrl: '/api/auth/square',
            icon: 'fa-square',
            color: '#27ae60'
        },
        toast: {
            name: 'Toast',
            authUrl: '/api/auth/toast',
            icon: 'fa-utensils',
            color: '#e74c3c'
        },
        harbortouch: {
            name: 'Harbortouch',
            authUrl: '/api/auth/harbortouch',
            icon: 'fa-ship',
            color: '#3498db'
        },
        revel: {
            name: 'Revel Systems',
            authUrl: '/api/auth/revel',
            icon: 'fa-glass-cheers',
            color: '#9b59b6'
        },
        clover: {
            name: 'Clover',
            authUrl: '/api/auth/clover',
            icon: 'fa-clover',
            color: '#2ecc71'
        },
        shopify: {
            name: 'Shopify',
            authUrl: '/api/auth/shopify',
            icon: 'fa-shopping-bag',
            color: '#1abc9c'
        },
        maxxpay: {
            name: 'MaxxPay',
            authUrl: '/api/auth/maxxpay',
            icon: 'fa-credit-card',
            color: '#e67e22'
        }
    };
    
    /**
     * Authenticate with a POS provider
     * @param {string} provider - The provider to authenticate with
     * @param {boolean} isSignup - Whether this is a signup or login
     */
    function authenticateWithProvider(provider, isSignup = false) {
        if (!authServices[provider]) {
            console.error(`Unknown provider: ${provider}`);
            return;
        }
        
        const service = authServices[provider];
        console.log(`${isSignup ? 'Signing up' : 'Logging in'} with ${service.name}...`);
        
        // In a real application, you would redirect to the provider's auth page
        // window.location.href = `${service.authUrl}?action=${isSignup ? 'signup' : 'login'}`;
        
        // For demo purposes, redirect to the main application after a delay
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 2000);
    }
});
