/**
 * Login Page JavaScript
 * Handles login/signup tabs, role selection, and Firebase authentication
 */

import { 
    login, 
    signup, 
    authenticateWithProvider, 
    onAuthStateChange 
} from './services/authService.js';
import { showSuccessNotification, showErrorNotification } from './utils/notificationUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    onAuthStateChange((user) => {
        if (user) {
            // Redirect to appropriate page based on role
            if (user.role === 'manager') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'home.html';
            }
        }
    });
    
    // Password toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Password matching check
    const signupPassword = document.getElementById('signup-password');
    const signupConfirm = document.getElementById('signup-confirm');
    const passwordMatchIndicator = document.getElementById('password-match-indicator');
    
    function checkPasswordMatch() {
        if (signupConfirm.value === '') {
            passwordMatchIndicator.textContent = '';
            passwordMatchIndicator.className = 'password-match-indicator';
            return;
        }
        
        if (signupPassword.value === signupConfirm.value) {
            passwordMatchIndicator.textContent = 'Passwords match';
            passwordMatchIndicator.className = 'password-match-indicator match';
        } else {
            passwordMatchIndicator.textContent = 'Passwords do not match';
            passwordMatchIndicator.className = 'password-match-indicator no-match';
        }
    }
    
    signupPassword.addEventListener('input', checkPasswordMatch);
    signupConfirm.addEventListener('input', checkPasswordMatch);
    
    // Other workplace functionality
    const signupWorkplace = document.getElementById('signup-workplace');
    const signupOtherWorkplaceGroup = document.querySelector('#signup-tab .other-workplace-group');
    
    signupWorkplace.addEventListener('change', function() {
        if (this.value === 'other') {
            signupOtherWorkplaceGroup.style.display = 'block';
        } else {
            signupOtherWorkplaceGroup.style.display = 'none';
        }
    });
    
    // Check if URL has a hash fragment for signup
    if (window.location.hash === '#signup') {
        // Find the signup tab button and click it
        const signupTabBtn = document.querySelector('.tab-btn[data-tab="signup-tab"]');
        if (signupTabBtn) {
            signupTabBtn.click();
        }
    }
    // DOM Elements - Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // DOM Elements - Role Selectors
    const roleBtns = document.querySelectorAll('.role-btn');
    const loginRoleInput = document.getElementById('login-role');
    const signupRoleInput = document.getElementById('signup-role');
    const managerCodeGroup = document.querySelector('.manager-code-group');
    
    // Check if a role was selected from the landing page
    const selectedRole = localStorage.getItem('selected_role');
    if (selectedRole) {
        // Find the role buttons for the active tab
        const activeTab = document.querySelector('.tab-panel.active');
        const activeTabRoleBtns = activeTab.querySelectorAll('.role-btn');
        
        // Remove active class from all role buttons in the active tab
        activeTabRoleBtns.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to the selected role button
        activeTabRoleBtns.forEach(btn => {
            if (btn.getAttribute('data-role') === selectedRole) {
                btn.classList.add('active');
                
                // Update the hidden role input
                if (activeTab.id === 'signup-tab') {
                    signupRoleInput.value = selectedRole;
                    
                    // Show/hide manager code field
                    if (selectedRole === 'manager') {
                        managerCodeGroup.style.display = 'block';
                    } else {
                        managerCodeGroup.style.display = 'none';
                    }
                } else {
                    loginRoleInput.value = selectedRole;
                }
            }
        });
        
        // Clear the selected role from localStorage
        localStorage.removeItem('selected_role');
    }
    
    // DOM Elements - Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    // DOM Elements - SSO
    const ssoBtns = document.querySelectorAll('.sso-btn');
    
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
    
    // Role Selection
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.getAttribute('data-role');
            const tabPanel = btn.closest('.tab-panel');
            const isSignup = tabPanel.id === 'signup-tab';
            
            // Remove active class from all role buttons in this tab panel
            tabPanel.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update hidden role input
            if (isSignup) {
                signupRoleInput.value = role;
                
                // Show/hide manager code field
                if (role === 'manager') {
                    managerCodeGroup.style.display = 'block';
                } else {
                    managerCodeGroup.style.display = 'none';
                }
            } else {
                loginRoleInput.value = role;
            }
        });
    });
    
    // Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show loading state
            const submitBtn = loginForm.querySelector('.auth-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;
            
            try {
                // Get form data
                const email = loginForm.querySelector('input[name="email"]').value;
                const password = loginForm.querySelector('input[name="password"]').value;
                
                // Validate form data
                if (!email || !password) {
                    throw new Error('Please fill in all required fields');
                }
                
                // Login with Firebase
                const user = await login(email, password, null);
                
                // Show success notification
                showSuccessNotification('Successfully logged in!');
                
                // Redirect to appropriate page based on role after a longer delay
                // This gives the notification time to be displayed and fade out
                setTimeout(() => {
                    if (user.role === 'manager') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'home.html';
                    }
                }, 3000);
            } catch (error) {
                // Show error notification
                showErrorNotification(error.message || 'Login failed. Please try again.');
                
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show loading state
            const submitBtn = signupForm.querySelector('.auth-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing up...';
            submitBtn.disabled = true;
            
            try {
                // Get form data
                const role = signupForm.querySelector('input[name="role"]').value;
                const name = signupForm.querySelector('input[name="name"]').value;
                const email = signupForm.querySelector('input[name="email"]').value;
                const password = signupForm.querySelector('input[name="password"]').value;
                const confirm = signupForm.querySelector('input[name="confirm"]').value;
                const workplace = signupForm.querySelector('select[name="workplace"]').value;
                const otherWorkplace = signupForm.querySelector('input[name="other_workplace"]')?.value;
                const position = signupForm.querySelector('select[name="position"]').value;
                const managerCode = role === 'manager' ? signupForm.querySelector('input[name="managerCode"]').value : null;
                
                // Get the actual workplace value (either selected or custom)
                const workplaceValue = workplace === 'other' ? otherWorkplace : workplace;
                
                // Validate form data
                if (!name || !email || !password || !confirm || !position) {
                    throw new Error('Please fill in all required fields');
                }
                
                if (workplace === 'other' && !otherWorkplace) {
                    throw new Error('Please enter your workplace name');
                }
                
                if (password !== confirm) {
                    throw new Error('Passwords do not match');
                }
                
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }
                
                if (role === 'manager' && !managerCode) {
                    throw new Error('Manager registration code is required');
                }
                
                // Sign up with Firebase
                const user = await signup(name, email, password, role, workplaceValue, position, managerCode);
                
                // Show success notification
                showSuccessNotification('Account created successfully!');
                
                // Redirect to appropriate page based on role after a longer delay
                // This gives the notification time to be displayed and fade out
                setTimeout(() => {
                    if (user.role === 'manager') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'home.html';
                    }
                }, 3000);
            } catch (error) {
                // Show error notification
                showErrorNotification(error.message || 'Signup failed. Please try again.');
                
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // SSO Button Click Handlers
    ssoBtns.forEach(btn => {
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
        
        if (classes.contains('google-btn')) {
            provider = 'google';
        } else if (classes.contains('shifts-btn')) {
            provider = '7shifts';
        }
        
        if (provider) {
            // Get the current role
            const isSignup = document.getElementById('signup-tab').classList.contains('active');
            const role = isSignup 
                ? document.getElementById('signup-role').value 
                : document.getElementById('login-role').value;
            
            // Show loading state
            const originalText = e.currentTarget.innerHTML;
            const action = isSignup ? 'Signing up' : 'Logging in';
            
            e.currentTarget.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${action}...</span>`;
            e.currentTarget.disabled = true;
            
            try {
                // Authenticate with provider
                authenticateWithProvider(provider, isSignup, role);
            } catch (error) {
                // Show error notification
                showErrorNotification(error.message || `Authentication with ${provider} failed. Please try again.`);
                
                // Reset button
                e.currentTarget.innerHTML = originalText;
                e.currentTarget.disabled = false;
            }
        }
    }
    
    // Add authentication service for each provider
    const authServices = {
        google: {
            name: 'Google',
            authUrl: '/api/auth/google',
            icon: 'fa-google',
            color: '#4285F4'
        },
        '7shifts': {
            name: '7Shifts',
            authUrl: '/api/auth/7shifts',
            icon: 'fa-calendar-alt',
            color: '#FF6B6B'
        }
    };
    
    /**
     * Authenticate with a provider
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
        
        // Show success notification
        showSuccessNotification(`Successfully authenticated with ${service.name}!`);
        
        // For demo purposes, redirect to the main application after a longer delay
        // This gives the notification time to be displayed and fade out
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 3000);
    }
});
