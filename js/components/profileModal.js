/**
 * Profile Modal Component
 * Handles displaying and editing user profile information in a modal
 */

import { getCurrentUser } from '../services/authService.js';
import { FirebaseImageViewer } from './firebaseImageViewer.js';
import { showNotification } from '../utils/uiUtils.js';
import { UserModel } from '../models/UserModel.js';

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
        
        // Track edit mode
        this.editMode = false;
        this.editForm = null;
        this.userData = null;
        
        // Initialize
        this.init();
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
        
        try {
            // Load user data
            console.log('🔍 Loading user data for profile...');
            await this.loadUserData();
            
            // Add edit button if not in edit mode
            if (!this.editMode) {
                this.addEditButton();
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
        
        // If in edit mode, switch back to display mode
        if (this.editMode) {
            this.switchToDisplayMode();
        }
    }
    
    /**
     * Load user data from auth service
     */
    async loadUserData() {
        console.log('👤 Loading user profile data...');
        
        // If in edit mode, make sure we have profile container
        if (this.editMode) {
            const profileInfo = document.querySelector('.profile-info');
            if (!profileInfo) {
                console.error('❌ Profile info container not found');
                return;
            }
        } else {
            // Check if profile fields exist in display mode
            if (!this.profileName || !this.profileEmail || !this.profileRole || 
                !this.profileWorkplace || !this.profilePosition || !this.profileSubscription) {
                console.error('❌ Profile fields not found in DOM');
                return;
            }
        }
        
        try {
            // First, try to get the current user from Firebase
            let user;
            try {
                console.log('🔍 Fetching current user data from Firebase...');
                user = await getCurrentUser();
                
                if (user) {
                    // Create a UserModel from the Firebase data
                    this.userData = new UserModel(user);
                    console.log('✅ User data retrieved from Firebase successfully');
                } else {
                    // Try to load from local storage as a fallback
                    const localUser = UserModel.loadFromLocalStorage();
                    if (localUser) {
                        this.userData = localUser;
                        console.log('✅ User data retrieved from local storage');
                    } else {
                        // Create default mock user if nothing found
                        this.userData = new UserModel({
                            id: 'user_jackson_fitzgerald',
                            name: 'Jackson Fitzgerald',
                            email: 'jackson@example.com',
                            role: 'bartender',
                            workplaceName: 'Cork Harbour Pub',
                            position: 'Bartender',
                            subscription_tier: 'premium'
                        });
                        console.log('✅ Using default user data');
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error getting user data from Firebase, checking local storage:', error);
                
                // Try to load from local storage
                const localUser = UserModel.loadFromLocalStorage();
                if (localUser) {
                    this.userData = localUser;
                    console.log('✅ User data retrieved from local storage');
                } else {
                    // Create default mock user
                    this.userData = new UserModel({
                        id: 'user_jackson_fitzgerald',
                        name: 'Jackson Fitzgerald',
                        email: 'jackson@example.com',
                        role: 'bartender',
                        workplaceName: 'Cork Harbour Pub',
                        position: 'Bartender',
                        subscription_tier: 'premium'
                    });
                    console.log('🔄 Using mock user data');
                }
            }
            
            // Update UI based on user data
            if (this.userData) {
                console.log('📝 Updating profile fields with user data');
                
                // Check if we're in edit mode or display mode
                if (this.editMode) {
                    // Update input fields in edit form
                    this.createEditableProfile(this.userData);
                } else {
                    // Update display fields
                    this.updateDisplayProfile(this.userData);
                }
                
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
     * Add edit button to profile content
     */
    addEditButton() {
        // Find profile info container
        const profileInfo = document.querySelector('.profile-info');
        if (!profileInfo) return;
        
        // Check if edit button already exists
        if (document.querySelector('.edit-profile-btn')) return;
        
        // Create edit button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'profile-actions';
        buttonContainer.style.cssText = `
            width: 100%;
            display: flex;
            justify-content: center;
            margin-top: 20px;
        `;
        
        // Create edit button
        const editButton = document.createElement('button');
        editButton.className = 'edit-profile-btn';
        editButton.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
        editButton.style.cssText = `
            background: linear-gradient(135deg, #FF8C42, #F76E11, #FF5757);
            color: white;
            border: none;
            border-radius: 20px;
            padding: 8px 16px;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        `;
        
        // Add hover effect
        editButton.onmouseover = () => {
            editButton.style.transform = 'translateY(-2px)';
            editButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        };
        editButton.onmouseout = () => {
            editButton.style.transform = 'translateY(0)';
            editButton.style.boxShadow = 'none';
        };
        
        // Add click event
        editButton.addEventListener('click', (e) => {
            console.log("Edit button clicked, switching to edit mode");
            e.preventDefault();
            e.stopPropagation();
            this.switchToEditMode();
        });
        
        // Add button to container and container to profile info
        buttonContainer.appendChild(editButton);
        profileInfo.appendChild(buttonContainer);
    }
    
    /**
     * Update the profile display with user data
     * @param {UserModel} user - The user data to display
     */
    updateDisplayProfile(user) {
        // Update profile fields
        this.profileName.textContent = user.name || 'Not provided';
        this.profileEmail.textContent = user.email || 'Not provided';
        this.profileRole.textContent = this.formatRole(user.role) || 'Not provided';
        this.profileWorkplace.textContent = user.workplaceName || 'Not provided';
        this.profilePosition.textContent = this.formatPosition(user.position) || 'Not provided';
        this.profileSubscription.textContent = this.formatSubscription(user.subscription_tier) || 'Free';
    }
    
    /**
     * Load establishments for dropdown
     * @returns {Promise<Array>} - Promise resolving to array of establishment objects
     */
    async loadEstablishments() {
        try {
            console.log('🔄 Loading establishments from Firebase...');
            
            // Import EstablishmentModel dynamically to avoid circular dependencies
            const { EstablishmentModel } = await import('../models/EstablishmentModel.js');
            
            // Add a hardcoded establishment just to test if the dropdown works
            const testEstablishment = new EstablishmentModel({
                id: 'qXtsIXX3LJSD7xgMfJFr',
                name: 'Cork Harbour',
                manager: 'Tanner Fitzgerald',
                possystem: 'lightspeed'
            });
            
            // Get all establishments
            console.log('🔄 Fetching establishments from EstablishmentModel.getAll()...');
            const establishments = await EstablishmentModel.getAll();
            console.log('📊 Raw establishments data:', establishments);
            
            // If no establishments were found from getAll(), use our test one
            if (establishments.length === 0) {
                console.log('⚠️ No establishments found in Firebase, adding hardcoded test establishment');
                return [testEstablishment];
            }
            
            console.log('✅ Loaded establishments for dropdown:', establishments.length);
            return establishments;
        } catch (error) {
            console.error('❌ Error loading establishments:', error);
            console.error('Error details:', error.message, error.stack);
            
            // Return hardcoded establishment as fallback in case of error
            const fallbackEstablishment = new EstablishmentModel({
                id: 'qXtsIXX3LJSD7xgMfJFr',
                name: 'Cork Harbour (Fallback)',
                manager: 'Tanner Fitzgerald',
                possystem: 'lightspeed'
            });
            
            return [fallbackEstablishment];
        }
    }
    
    /**
     * Create editable profile form
     * @param {UserModel} user - The user data to populate the form
     */
    async createEditableProfile(user) {
        // Transform the profile modal into an editable form
        const profileInfo = document.querySelector('.profile-info');
        if (!profileInfo) return;
        
        // Create edit form if it doesn't exist
        if (!this.editForm) {
            // Clear profile info
            profileInfo.innerHTML = '';
            
            // Create form
            this.editForm = document.createElement('form');
            this.editForm.id = 'profileEditForm';
            this.editForm.className = 'profile-edit-form';
            
            // Style the form
            this.editForm.style.cssText = `
                width: 100%;
                padding: 10px;
            `;
            
            // Create input fields
            const fields = [
                { id: 'name', label: 'Name', value: user.name || '', required: true },
                { id: 'email', label: 'Email', value: user.email || '', type: 'email', required: true, readonly: true },
                { id: 'role', label: 'Role', value: user.role || 'bartender', type: 'select', options: [
                    { value: 'bartender', label: 'Bartender' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'owner', label: 'Owner' }
                ]},
                { id: 'workplaceId', label: 'Workplace', value: user.workplaceId || '', type: 'select-establishments' },
                { id: 'position', label: 'Position', value: user.position || '' },
                { id: 'subscription_tier', label: 'Subscription', value: user.subscription_tier || 'free', type: 'select', options: [
                    { value: 'free', label: 'Free' },
                    { value: 'basic', label: 'Basic' },
                    { value: 'premium', label: 'Premium' },
                    { value: 'enterprise', label: 'Enterprise' }
                ]}
            ];
            
            // Add fields to form
            fields.forEach(field => {
                const fieldContainer = document.createElement('div');
                fieldContainer.className = 'form-field';
                fieldContainer.style.cssText = `
                    margin-bottom: 15px;
                    width: 100%;
                `;
                
                const label = document.createElement('label');
                label.htmlFor = `profile-${field.id}`;
                label.textContent = field.label;
                label.style.cssText = `
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                `;
                fieldContainer.appendChild(label);
                
                if (field.type === 'select-establishments') {
                    // Create select element for establishments
                    const select = document.createElement('select');
                    select.id = `profile-${field.id}`;
                    select.name = field.id;
                    if (field.required) select.required = true;
                    select.style.cssText = `
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 16px;
                    `;
                    
                    // Add loading option
                    const loadingOption = document.createElement('option');
                    loadingOption.value = '';
                    loadingOption.textContent = 'Loading establishments...';
                    select.appendChild(loadingOption);
                    
                    // Load establishments from Firebase
                    this.loadEstablishments().then(establishments => {
                        // Clear loading option
                        select.innerHTML = '';
                        
                        // Add blank option
                        const blankOption = document.createElement('option');
                        blankOption.value = '';
                        blankOption.textContent = '-- Select Workplace --';
                        select.appendChild(blankOption);
                        
                        // Add establishments as options
                        establishments.forEach(establishment => {
                            const option = document.createElement('option');
                            option.value = establishment.id;
                            option.textContent = establishment.name;
                            
                            // Select the current user's workplace if it matches
                            if (field.value === establishment.id) {
                                option.selected = true;
                            }
                            
                            select.appendChild(option);
                        });
                        
                        // If no establishments were loaded, add a message
                        if (establishments.length === 0) {
                            const noDataOption = document.createElement('option');
                            noDataOption.value = '';
                            noDataOption.textContent = 'No establishments available';
                            select.appendChild(noDataOption);
                        }
                    }).catch(error => {
                        console.error('Error loading establishments for dropdown:', error);
                        
                        // Show error option
                        select.innerHTML = '';
                        const errorOption = document.createElement('option');
                        errorOption.value = '';
                        errorOption.textContent = 'Error loading establishments';
                        select.appendChild(errorOption);
                    });
                    
                    fieldContainer.appendChild(select);
                } else if (field.type === 'select') {
                    // Regular select element
                    const select = document.createElement('select');
                    select.id = `profile-${field.id}`;
                    select.name = field.id;
                    if (field.required) select.required = true;
                    select.style.cssText = `
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 16px;
                    `;
                    
                    // Add options
                    field.options.forEach(option => {
                        const optionEl = document.createElement('option');
                        optionEl.value = option.value;
                        optionEl.textContent = option.label;
                        if (field.value === option.value) optionEl.selected = true;
                        select.appendChild(optionEl);
                    });
                    
                    fieldContainer.appendChild(select);
                } else {
                    // Create input element
                    const input = document.createElement('input');
                    input.type = field.type || 'text';
                    input.id = `profile-${field.id}`;
                    input.name = field.id;
                    input.value = field.value;
                    if (field.required) input.required = true;
                    if (field.readonly) input.readOnly = true;
                    input.style.cssText = `
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 16px;
                        ${field.readonly ? 'background-color: #f5f5f5;' : ''}
                    `;
                    
                    fieldContainer.appendChild(input);
                }
                
                this.editForm.appendChild(fieldContainer);
            });
            
            // Add button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'form-actions';
            buttonContainer.style.cssText = `
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            `;
            
            // Add save button
            const saveButton = document.createElement('button');
            saveButton.type = 'submit';
            saveButton.className = 'save-btn';
            saveButton.textContent = 'Save Changes';
            saveButton.style.cssText = `
                background: linear-gradient(135deg, #FF8C42, #F76E11, #FF5757);
                color: white;
                border: none;
                border-radius: 20px;
                padding: 10px 20px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            `;
            buttonContainer.appendChild(saveButton);
            
            // Add cancel button
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'cancel-btn';
            cancelButton.textContent = 'Cancel';
            cancelButton.style.cssText = `
                background-color: white;
                color: #F76E11;
                border: 1px solid #F76E11;
                border-radius: 20px;
                padding: 10px 20px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            `;
            cancelButton.addEventListener('click', () => this.cancelEdit());
            buttonContainer.appendChild(cancelButton);
            
            this.editForm.appendChild(buttonContainer);
            
            // Add form submission handler
            this.editForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
            
            // Add form to profile info
            profileInfo.appendChild(this.editForm);
        } else {
            // Just update form values
            document.getElementById('profile-name').value = user.name || '';
            document.getElementById('profile-email').value = user.email || '';
            document.getElementById('profile-role').value = user.role || 'bartender';
            document.getElementById('profile-workplaceId').value = user.workplaceId || '';
            document.getElementById('profile-position').value = user.position || '';
            document.getElementById('profile-subscription_tier').value = user.subscription_tier || 'free';
        }
    }
    
    /**
     * Handle profile form submission
     * @param {Event} e - The submit event
     */
    async handleProfileSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this.editForm);
        
        // Get the selected workplace ID
        const workplaceId = formData.get('workplaceId');
        let workplaceName = '';
        
        // If workplace ID is selected, get the name from the select element
        if (workplaceId) {
            const workplaceSelect = document.getElementById('profile-workplaceId');
            const selectedOption = workplaceSelect.options[workplaceSelect.selectedIndex];
            workplaceName = selectedOption ? selectedOption.textContent : '';
        }
        
        const updatedData = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            workplaceId: workplaceId,
            workplaceName: workplaceName,
            position: formData.get('position'),
            subscription_tier: formData.get('subscription_tier')
        };
        
        try {
            // Show loading state
            const saveBtn = this.editForm.querySelector('.save-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            // Use the UserModel to update the profile
            const success = await this.userData.updateProfile(updatedData);
            
            if (success) {
                // Switch back to display mode
                this.editMode = false;
                this.switchToDisplayMode();
            } else {
                // Re-enable save button if update failed
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showNotification('Failed to save profile changes. Please try again.', 'error');
            
            // Re-enable save button
            const saveBtn = this.editForm.querySelector('.save-btn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
        }
    }
    
    /**
     * Switch to display mode
     */
    switchToDisplayMode() {
        this.editMode = false;
        
        // Remove edit form
        const profileInfo = document.querySelector('.profile-info');
        if (profileInfo) {
            profileInfo.innerHTML = '';
            
            // Create avatar
            const avatar = document.createElement('div');
            avatar.className = 'profile-avatar';
            avatar.innerHTML = '<i class="fas fa-user-circle"></i>';
            profileInfo.appendChild(avatar);
            
            // Create details container
            const details = document.createElement('div');
            details.className = 'profile-details';
            
            // Create fields
            const fields = [
                { id: 'profileName', label: 'Name' },
                { id: 'profileEmail', label: 'Email' },
                { id: 'profileRole', label: 'Role' },
                { id: 'profileWorkplace', label: 'Workplace' },
                { id: 'profilePosition', label: 'Position' },
                { id: 'profileSubscription', label: 'Subscription' }
            ];
            
            fields.forEach(field => {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'profile-field';
                
                const label = document.createElement('label');
                label.textContent = field.label + ':';
                fieldDiv.appendChild(label);
                
                const span = document.createElement('span');
                span.id = field.id;
                span.textContent = 'Loading...';
                fieldDiv.appendChild(span);
                
                details.appendChild(fieldDiv);
            });
            
            profileInfo.appendChild(details);
            
            // Update references to profile fields
            this.profileName = document.getElementById('profileName');
            this.profileEmail = document.getElementById('profileEmail');
            this.profileRole = document.getElementById('profileRole');
            this.profileWorkplace = document.getElementById('profileWorkplace');
            this.profilePosition = document.getElementById('profilePosition');
            this.profileSubscription = document.getElementById('profileSubscription');
            
            // Update display with current user data
            if (this.userData) {
                this.updateDisplayProfile(this.userData);
            }
            
            // Add edit button
            this.addEditButton();
        }
    }
    
    /**
     * Switch to edit mode
     */
    switchToEditMode() {
        console.log("Switching to edit mode");
        this.editMode = true;
        this.editForm = null; // Force recreation of form
        
        // Load user data in edit mode
        this.loadUserData();
    }
    
    /**
     * Cancel editing and return to display mode
     */
    cancelEdit() {
        this.switchToDisplayMode();
    }
    
    /**
     * Set default values for profile fields
     */
    setDefaultValues() {
        if (!this.editMode) {
            this.profileName.textContent = 'Not available';
            this.profileEmail.textContent = 'Not available';
            this.profileRole.textContent = 'Not available';
            this.profileWorkplace.textContent = 'Not available';
            this.profilePosition.textContent = 'Not available';
            this.profileSubscription.textContent = 'Free';
        }
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
