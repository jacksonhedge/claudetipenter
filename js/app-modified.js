/**
 * Modified App.js for testing the Enhanced Phone Scanner
 * This version disables authentication requirements
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Loading modified app.js with auth bypass...');
    
    // Bypass authentication check
    if (window.location.href.includes('home.html')) {
        console.log('Authentication bypass enabled for testing');
        
        // Enable tab navigation without authentication
        const navItems = document.querySelectorAll('.nav-item');
        const sidebarMenuItems = document.querySelectorAll('.sidebar-menu-item');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Tab Navigation function
        const switchTab = (tabId) => {
            console.log('Switching to tab:', tabId);
            
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            sidebarMenuItems.forEach(item => item.classList.remove('active'));
            
            // Add active class to items with matching data-tab
            navItems.forEach(navItem => {
                if (navItem.getAttribute('data-tab') === tabId) {
                    navItem.classList.add('active');
                }
            });
            
            sidebarMenuItems.forEach(item => {
                if (item.getAttribute('data-tab') === tabId) {
                    item.classList.add('active');
                }
            });
            
            // Hide all tabs
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }
        };
        
        // Add click event to nav items
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabId = item.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // Add click event to sidebar menu items
        sidebarMenuItems.forEach(item => {
            // Skip the auth link item
            if (!item.classList.contains('auth-link')) {
                item.addEventListener('click', () => {
                    const tabId = item.getAttribute('data-tab');
                    switchTab(tabId);
                });
            }
        });
        
        // Prevent authentication redirect
        const authCheckScript = document.querySelector('script:not([src])');
        if (authCheckScript && authCheckScript.textContent.includes('window.location.href = \'login.html\'')) {
            console.log('Removing auth redirect script');
            authCheckScript.remove();
        }
        
        // Create test user data for mocking
        localStorage.setItem('user_id', 'test_user_id');
        localStorage.setItem('user_email', 'test@example.com');
        localStorage.setItem('user_role', 'manager');
        
        // Update profile info
        const profileNameElement = document.getElementById('sidebarProfileName');
        const profileEmailElement = document.getElementById('sidebarProfileEmail');
        
        if (profileNameElement) {
            profileNameElement.textContent = 'Test User';
        }
        
        if (profileEmailElement) {
            profileEmailElement.textContent = 'test@example.com';
        }
    }
});
