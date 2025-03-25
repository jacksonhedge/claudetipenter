// Admin Login Script

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const adminLoginOverlay = document.getElementById('admin-login-overlay');
    const adminContainer = document.getElementById('admin-container');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminPasswordInput = document.getElementById('admin-password');
    const passwordError = document.getElementById('password-error');
    const togglePasswordBtn = document.getElementById('toggle-password');
    
    // Admin password - in a real application, this would be authenticated through Firebase
    const ADMIN_PASSWORD = 'admin123';
    
    // Check if user is already logged in (using localStorage for demo purposes)
    if (localStorage.getItem('admin_logged_in') === 'true') {
        adminLoginOverlay.style.display = 'none';
        adminContainer.style.display = 'flex';
    }
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission
            
            const type = adminPasswordInput.type === 'password' ? 'text' : 'password';
            adminPasswordInput.type = type;
            
            // Toggle icon
            const icon = togglePasswordBtn.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
    
    // Handle admin login
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission
            
            const password = adminPasswordInput.value;
            
            if (password === ADMIN_PASSWORD) {
                // Hide login overlay and show admin container
                adminLoginOverlay.style.display = 'none';
                adminContainer.style.display = 'flex';
                
                // Store login state in localStorage (for demo purposes)
                localStorage.setItem('admin_logged_in', 'true');
                
                // Clear password field
                adminPasswordInput.value = '';
                
                // Clear any error messages
                passwordError.textContent = '';
            } else {
                // Show error message
                passwordError.textContent = 'Invalid password. Please try again.';
                
                // Clear password field
                adminPasswordInput.value = '';
            }
        });
    }
    
    // Allow pressing Enter to submit
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                adminLoginBtn.click();
            }
        });
    }
    
    // Add sign-out functionality
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Clear login state
            localStorage.removeItem('admin_logged_in');
            
            // Show login overlay and hide admin container
            adminLoginOverlay.style.display = 'flex';
            adminContainer.style.display = 'none';
        });
    }
    
    // Tab navigation functionality
    const navItems = document.querySelectorAll('.admin-nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Skip if this is the sign-out button
            if (item.id === 'sign-out-btn') {
                return;
            }
            
            // Get the tab to show
            const tabId = item.getAttribute('data-tab');
            
            // Remove active class from all nav items
            navItems.forEach(navItem => {
                if (navItem.id !== 'sign-out-btn') {
                    navItem.classList.remove('active');
                }
            });
            
            // Add active class to clicked nav item
            item.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show the selected tab content
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
});
