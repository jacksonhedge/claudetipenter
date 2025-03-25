// Simple login script without Firebase dependencies
document.addEventListener('DOMContentLoaded', () => {
    console.log('Simple login script loaded');
    
    // Get the login form and button
    const loginForm = document.getElementById('login-form');
    const loginButton = document.querySelector('#login-form .auth-btn');
    
    // Add event listener to the login button
    if (loginButton) {
        console.log('Adding click event to login button');
        
        loginButton.addEventListener('click', function(e) {
            console.log('Login button clicked');
            e.preventDefault();
            
            // Get form data
            const email = document.querySelector('#login-email').value;
            const password = document.querySelector('#login-password').value;
            const role = document.querySelector('#login-role').value;
            
            // Basic validation
            if (!email || !password) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Store user data in localStorage
            const userId = 'user_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_role', role || 'bartender');
            localStorage.setItem('user_name', email.split('@')[0]);
            
            // Set auth transition flag
            sessionStorage.setItem('auth_transition', 'true');
            
            // Show success message
            alert('Login successful! Redirecting...');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 500);
        });
    } else {
        console.error('Login button not found');
    }
    
    // Get the signup form and button
    const signupForm = document.getElementById('signup-form');
    const signupButton = document.querySelector('#signup-form .auth-btn');
    
    // Add event listener to the signup button
    if (signupButton) {
        console.log('Adding click event to signup button');
        
        signupButton.addEventListener('click', function(e) {
            console.log('Signup button clicked');
            e.preventDefault();
            
            // Get form data
            const name = document.querySelector('#signup-name').value;
            const email = document.querySelector('#signup-email').value;
            const password = document.querySelector('#signup-password').value;
            const confirm = document.querySelector('#signup-confirm').value;
            const role = document.querySelector('#signup-role').value;
            
            // Basic validation
            if (!name || !email || !password || !confirm) {
                alert('Please fill in all required fields');
                return;
            }
            
            if (password !== confirm) {
                alert('Passwords do not match');
                return;
            }
            
            // Store user data in localStorage
            const userId = 'user_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_role', role || 'bartender');
            localStorage.setItem('user_name', name);
            
            // Set auth transition flag
            sessionStorage.setItem('auth_transition', 'true');
            
            // Show success message
            alert('Account created successfully! Redirecting...');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 500);
        });
    }
    
    // Initialize tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Get the target tab
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and panels
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Initialize role buttons
    const roleBtns = document.querySelectorAll('.role-btn');
    
    roleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Get the role and tab
            const role = this.getAttribute('data-role');
            const tabPanel = this.closest('.tab-panel');
            
            // Remove active class from all role buttons in this tab
            tabPanel.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update the hidden role input
            if (tabPanel.id === 'login-tab') {
                document.getElementById('login-role').value = role;
            } else {
                document.getElementById('signup-role').value = role;
            }
        });
    });
});
