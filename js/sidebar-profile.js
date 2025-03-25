/**
 * Sidebar Profile Handler
 * Populates the sidebar profile with user data and handles the sign out button
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebarProfile = document.getElementById('sidebarProfile');
    const sidebarProfileName = document.getElementById('sidebarProfileName');
    const sidebarProfileEmail = document.getElementById('sidebarProfileEmail');
    const sidebarSignoutBtn = document.getElementById('sidebarSignoutBtn');
    
    // Get user data from localStorage
    const userId = localStorage.getItem('user_id');
    const userEmail = localStorage.getItem('user_email');
    const userName = localStorage.getItem('user_name');
    
    // Populate the sidebar profile if user is logged in
    if (userId && userEmail) {
        // Update the profile info
        sidebarProfileName.textContent = userName || 'User';
        sidebarProfileEmail.textContent = userEmail;
        
        // Show the profile section
        sidebarProfile.style.display = 'flex';
    } else {
        // Hide the profile section if not logged in
        sidebarProfile.style.display = 'none';
    }
    
    // Handle sign out button click
    if (sidebarSignoutBtn) {
        sidebarSignoutBtn.addEventListener('click', () => {
            console.log('Signing out...');
            
            // Clear user data from localStorage
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_role');
            
            // Show success message
            alert('You have been signed out successfully.');
            
            // Redirect to login page
            window.location.href = 'login.html';
        });
    }
});
