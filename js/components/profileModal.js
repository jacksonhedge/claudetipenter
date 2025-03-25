/**
 * Profile Modal Component
 * Handles displaying user profile information in a modal
 */

import { getCurrentUser } from '../services/authService.js';
import { FirebaseImageViewer } from './firebaseImageViewer.js';

class ProfileModal {
    constructor() {
        // DOM Elements
        this.profileBtn = document.getElementById('profileBtn');
        this.profileModal = document.getElementById('profileModal');
        this.profileClose = document.querySelector('.profile-close');
        
        // Profile fields
        this.profileName = document.getElementById('profileName');
        this.profileEmail = document.getElementById('profileEmail');
        this.profileRole = document.getElementById('profileRole');
        this.profileWorkplace = document.getElementById('profileWorkplace');
        this.profilePosition = document.getElementById('profilePosition');
        this.profileSubscription = document.getElementById('profileSubscription');
        
        // Tab elements
        this.profileTabsContainer = document.getElementById('profileTabs');
        this.profileContentContainer = document.getElementById('profileContent');
        
        // Initialize
        this.init();
        
        // Store active tab
        this.activeTab = 'profile';
    }
    
    /**
     * Initialize the profile modal
     */
    init() {
        console.log('📝 Initializing profile modal...');
        
        if (!this.profileBtn) {
            console.warn('❌ Profile button not found');
        }
        
        if (!this.profileModal) {
            console.warn('❌ Profile modal element not found');
        }
        
        if (!this.profileBtn || !this.profileModal) {
            console.warn('❌ Profile modal initialization skipped due to missing elements');
            return;
        }
        
        console.log('✅ Profile modal elements found, adding event listeners');
        
        // Add event listeners
        this.profileBtn.addEventListener('click', this.openModal.bind(this));
        
        if (this.profileClose) {
            this.profileClose.addEventListener('click', this.closeModal.bind(this));
        } else {
            console.warn('⚠️ Profile close button not found, close functionality may be limited');
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.profileModal) {
                this.closeModal();
            }
        });
        
        // Close modal when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.profileModal.style.display === 'block') {
                this.closeModal();
            }
        });
        
        console.log('✅ Profile modal initialized successfully');
    }
    
    /**
     * Open the profile modal and load user data
     */
    async openModal() {
        console.log('🔍 Opening profile modal...');
        
        // Check if modal element exists
        if (!this.profileModal) {
            console.error('❌ Cannot open profile modal: modal element not found');
            return;
        }
        
        // Show the modal
        this.profileModal.style.display = 'block';
        console.log('✅ Profile modal displayed');
        
        // Create tabs if they don't exist
        console.log('🔍 Creating profile tabs...');
        this.createTabs();
        
        try {
            // Load user data
            console.log('🔍 Loading user data for profile...');
            await this.loadUserData();
            
            // Initialize image viewer if on the images tab
            if (this.activeTab === 'images' && this.imageViewerContainer) {
                console.log('🔍 Initializing image viewer for images tab...');
                this.initImageViewer();
            }
            
            console.log('✅ Profile modal fully loaded');
        } catch (error) {
            console.error('❌ Error in profile modal opening:', error);
        }
    }
    
    /**
     * Close the profile modal
     */
    closeModal() {
        this.profileModal.style.display = 'none';
    }
    
    /**
     * Create the tabs for the profile modal
     */
    createTabs() {
        // Skip if already created
        if (this.tabsCreated) return;
        
        // Create tabs container if it doesn't exist
        if (!this.profileTabsContainer) {
            this.profileTabsContainer = document.createElement('div');
            this.profileTabsContainer.id = 'profileTabs';
            this.profileTabsContainer.className = 'profile-tabs';
            
            // Insert after the profile header
            const profileHeader = document.querySelector('.profile-header');
            if (profileHeader && profileHeader.parentNode) {
                profileHeader.parentNode.insertBefore(this.profileTabsContainer, profileHeader.nextSibling);
            }
        }
        
        // Create content container if it doesn't exist
        if (!this.profileContentContainer) {
            this.profileContentContainer = document.createElement('div');
            this.profileContentContainer.id = 'profileContent';
            this.profileContentContainer.className = 'profile-content';
            
            // Get the existing profile content
            const existingContent = document.querySelector('.profile-info');
            
            if (existingContent && existingContent.parentNode) {
                // Wrap existing content in a tab container
                const profileTabContent = document.createElement('div');
                profileTabContent.id = 'profileTabContent';
                profileTabContent.className = 'tab-content active';
                profileTabContent.dataset.tab = 'profile';
                
                // Clone existing content to the tab content
                const clonedContent = existingContent.cloneNode(true);
                profileTabContent.appendChild(clonedContent);
                
                // Add the tab content to the content container
                this.profileContentContainer.appendChild(profileTabContent);
                
                // Replace the existing content with the tabbed content
                existingContent.parentNode.replaceChild(this.profileContentContainer, existingContent);
            }
        }
        
        // Create the tabs
        const tabs = [
            { id: 'profile', label: 'Profile', icon: 'user' },
            { id: 'images', label: 'My Images', icon: 'images' }
        ];
        
        // Clear existing tabs
        this.profileTabsContainer.innerHTML = '';
        
        // Add tabs
        tabs.forEach(tab => {
            const tabElement = document.createElement('div');
            tabElement.className = `profile-tab ${tab.id === this.activeTab ? 'active' : ''}`;
            tabElement.dataset.tab = tab.id;
            
            tabElement.innerHTML = `
                <i class="fas fa-${tab.icon}"></i>
                <span>${tab.label}</span>
            `;
            
            tabElement.addEventListener('click', () => this.switchTab(tab.id));
            
            this.profileTabsContainer.appendChild(tabElement);
        });
        
        // Create the image viewer container if it doesn't exist
        if (!this.imageViewerContainer) {
            this.imageViewerContainer = document.createElement('div');
            this.imageViewerContainer.id = 'imageViewerContainer';
            this.imageViewerContainer.className = 'tab-content';
            this.imageViewerContainer.dataset.tab = 'images';
            
            // Add empty placeholder
            this.imageViewerContainer.innerHTML = '<div class="loading-placeholder">Loading images...</div>';
            
            // Add to content container
            this.profileContentContainer.appendChild(this.imageViewerContainer);
        }
        
        // Mark as created
        this.tabsCreated = true;
    }
    
    /**
     * Switch between tabs
     * @param {string} tabId - The ID of the tab to switch to
     */
    switchTab(tabId) {
        // Update active tab
        this.activeTab = tabId;
        
        // Update tab buttons
        const tabs = this.profileTabsContainer.querySelectorAll('.profile-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Update tab content
        const tabContents = this.profileContentContainer.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabId);
        });
        
        // Initialize image viewer if switching to images tab
        if (tabId === 'images') {
            this.initImageViewer();
        }
    }
    
    /**
     * Initialize the image viewer
     */
    initImageViewer() {
        // Don't re-initialize if already done
        if (this.imageViewerInitialized) return;
        
        // Clear the container
        this.imageViewerContainer.innerHTML = '';
        
        // Create the image viewer
        this.imageViewer = new FirebaseImageViewer(this.imageViewerContainer);
        
        // Mark as initialized
        this.imageViewerInitialized = true;
    }
    
    /**
     * Load user data from auth service
     */
    async loadUserData() {
        console.log('👤 Loading user profile data...');
        
        // Check if profile fields exist
        if (!this.profileName || !this.profileEmail || !this.profileRole || 
            !this.profileWorkplace || !this.profilePosition || !this.profileSubscription) {
            console.error('❌ Profile fields not found in DOM');
            return;
        }
        
        try {
            // For demo purposes, use mock data if Firebase fails
            let user;
            try {
                console.log('🔍 Fetching current user data from Firebase...');
                user = await getCurrentUser();
                console.log('✅ User data retrieved successfully:', user ? 'User found' : 'No user found');
            } catch (error) {
                console.warn('⚠️ Error getting user data from Firebase, using mock data:', error);
                // Create mock user data
                user = {
                    name: 'Demo User',
                    email: 'user@example.com',
                    role: 'bartender',
                    workplaceName: 'The Rustic Table',
                    position: 'Bartender',
                    subscription_tier: 'free'
                };
                console.log('🔄 Using mock user data:', user);
            }
            
            if (user) {
                console.log('📝 Updating profile fields with user data');
                // Update profile fields
                this.profileName.textContent = user.name || 'Not provided';
                this.profileEmail.textContent = user.email || 'Not provided';
                this.profileRole.textContent = this.formatRole(user.role) || 'Not provided';
                this.profileWorkplace.textContent = user.workplaceName || 'Not provided';
                this.profilePosition.textContent = this.formatPosition(user.position) || 'Not provided';
                this.profileSubscription.textContent = this.formatSubscription(user.subscription_tier) || 'Free';
                
                console.log('✅ Profile data updated successfully');
            } else {
                console.warn('⚠️ No user data available, using default values');
                // Set default values if user not found
                this.setDefaultValues();
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            this.setDefaultValues();
        }
    }
    
    /**
     * Set default values for profile fields
     */
    setDefaultValues() {
        this.profileName.textContent = 'Not available';
        this.profileEmail.textContent = 'Not available';
        this.profileRole.textContent = 'Not available';
        this.profileWorkplace.textContent = 'Not available';
        this.profilePosition.textContent = 'Not available';
        this.profileSubscription.textContent = 'Free';
    }
    
    /**
     * Format role for display
     * @param {string} role - The user's role
     * @returns {string} - Formatted role
     */
    formatRole(role) {
        if (!role) return 'Not provided';
        
        // Capitalize first letter
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
    
    /**
     * Format position for display
     * @param {string} position - The user's position
     * @returns {string} - Formatted position
     */
    formatPosition(position) {
        if (!position) return 'Not provided';
        
        // Capitalize first letter
        return position.charAt(0).toUpperCase() + position.slice(1);
    }
    
    /**
     * Format subscription tier for display
     * @param {string} tier - The subscription tier
     * @returns {string} - Formatted subscription tier
     */
    formatSubscription(tier) {
        if (!tier) return 'Free';
        
        switch (tier.toLowerCase()) {
            case 'free':
                return 'Free';
            case 'basic':
                return 'Basic';
            case 'premium':
                return 'Premium';
            case 'enterprise':
                return 'Enterprise';
            default:
                return tier.charAt(0).toUpperCase() + tier.slice(1);
        }
    }
}

export default ProfileModal;
