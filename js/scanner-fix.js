/**
 * Fix for scanner.html tab navigation
 * This script ensures sidebar tab navigation works correctly 
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get sidebar menu items
    const sidebarMenuItems = document.querySelectorAll('.sidebar-menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Tab Navigation function
    const switchTab = (tabId) => {
        console.log('Switching to tab:', tabId);
        
        // Remove active class from all sidebar items
        sidebarMenuItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to clicked item
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
    
    // Add click event to sidebar menu items
    sidebarMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const tabId = item.getAttribute('data-tab');
            console.log('Sidebar menu item clicked:', tabId);
            switchTab(tabId);
        });
    });
    
    console.log('Scanner tab fix loaded - sidebar navigation should now work!');
});
