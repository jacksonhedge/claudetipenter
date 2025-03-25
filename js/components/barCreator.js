/**
 * Bar Creator Component
 * Allows users to create and manage bar establishments
 */

import { BarModel } from '../models/BarModel.js';
import { showNotification } from '../utils/uiUtils.js';
import { getCurrentUser } from '../services/authService.js';

class BarCreator {
    constructor(options = {}) {
        // DOM element IDs
        this.containerId = options.containerId || 'barCreatorContainer';
        this.formId = options.formId || 'barCreateForm';
        this.barListId = options.barListId || 'barList';
        
        // Component state
        this.currentUser = null;
        this.bars = [];
        this.editingBarId = null;
        
        // Initialize the component
        this.init();
    }
    
    /**
     * Initialize the bar creator component
     */
    async init() {
        console.log('Initializing Bar Creator component...');
        
        // Get container element
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Bar Creator container with ID ${this.containerId} not found`);
            return;
        }
        
        // Get the current user
        try {
            this.currentUser = await getCurrentUser();
        } catch (error) {
            console.error('Error getting current user:', error);
        }
        
        // Create component UI
        this.createUi();
        
        // Load bars (if the component has been initialized with a bar list element)
        this.barListElement = document.getElementById(this.barListId);
        if (this.barListElement) {
            this.loadBars();
        }
        
        console.log('Bar Creator component initialized');
    }
    
    /**
     * Create the component UI
     */
    createUi() {
        // Clear container
        this.container.innerHTML = '';
        this.container.classList.add('bar-creator');
        
        // Create form
        const form = document.createElement('form');
        form.id = this.formId;
        form.className = 'bar-creator-form';
        
        // Form title
        const title = document.createElement('h3');
        title.textContent = this.editingBarId ? 'Edit Bar' : 'Create New Bar';
        title.className = 'bar-creator-title';
        form.appendChild(title);
        
        // Create form fields
        const fields = this.createFormFields();
        fields.forEach(field => {
            form.appendChild(field);
        });
        
        // Create form actions
        const actions = document.createElement('div');
        actions.className = 'form-actions';
        
        // Save button
        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.textContent = this.editingBarId ? 'Update Bar' : 'Create Bar';
        saveButton.className = 'btn btn-primary bar-save-btn';
        actions.appendChild(saveButton);
        
        // Cancel button (only for edit mode)
        if (this.editingBarId) {
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.textContent = 'Cancel';
            cancelButton.className = 'btn btn-secondary bar-cancel-btn';
            cancelButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.cancelEdit();
            });
            actions.appendChild(cancelButton);
        }
        
        form.appendChild(actions);
        
        // Add form submission handler
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Add form to container
        this.container.appendChild(form);
    }
    
    /**
     * Create form fields for bar creation/editing
     * @returns {Array} - Array of form field elements
     */
    createFormFields() {
        const fields = [];
        
        // Helper function to create field container
        const createFieldContainer = (id, label, required = false) => {
            const container = document.createElement('div');
            container.className = 'form-field';
            
            const labelElement = document.createElement('label');
            labelElement.htmlFor = id;
            labelElement.textContent = label + (required ? ' *' : '');
            container.appendChild(labelElement);
            
            return container;
        };
        
        // Basic Information Section
        const basicInfoSection = document.createElement('div');
        basicInfoSection.className = 'form-section';
        
        const basicInfoTitle = document.createElement('h4');
        basicInfoTitle.textContent = 'Basic Information';
        basicInfoSection.appendChild(basicInfoTitle);
        
        // Bar Name
        const nameContainer = createFieldContainer('barName', 'Bar Name', true);
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'barName';
        nameInput.name = 'name';
        nameInput.required = true;
        nameInput.placeholder = 'Enter bar name';
        nameContainer.appendChild(nameInput);
        basicInfoSection.appendChild(nameContainer);
        
        // Bar Type
        const typeContainer = createFieldContainer('barType', 'Bar Type');
        const typeSelect = document.createElement('select');
        typeSelect.id = 'barType';
        typeSelect.name = 'type';
        
        const barTypes = [
            { value: 'bar', label: 'Bar' },
            { value: 'pub', label: 'Pub' },
            { value: 'cocktail_bar', label: 'Cocktail Bar' },
            { value: 'sports_bar', label: 'Sports Bar' },
            { value: 'nightclub', label: 'Nightclub' },
            { value: 'dive_bar', label: 'Dive Bar' },
            { value: 'brewpub', label: 'Brewpub' },
            { value: 'wine_bar', label: 'Wine Bar' },
            { value: 'speakeasy', label: 'Speakeasy' },
            { value: 'other', label: 'Other' }
        ];
        
        barTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            typeSelect.appendChild(option);
        });
        
        typeContainer.appendChild(typeSelect);
        basicInfoSection.appendChild(typeContainer);
        
        // Address
        const addressContainer = createFieldContainer('barAddress', 'Address');
        const addressInput = document.createElement('input');
        addressInput.type = 'text';
        addressInput.id = 'barAddress';
        addressInput.name = 'address';
        addressInput.placeholder = 'Street address';
        addressContainer.appendChild(addressInput);
        basicInfoSection.appendChild(addressContainer);
        
        // City
        const cityContainer = createFieldContainer('barCity', 'City', true);
        const cityInput = document.createElement('input');
        cityInput.type = 'text';
        cityInput.id = 'barCity';
        cityInput.name = 'city';
        cityInput.required = true;
        cityInput.placeholder = 'City';
        cityContainer.appendChild(cityInput);
        basicInfoSection.appendChild(cityContainer);
        
        // State
        const stateContainer = createFieldContainer('barState', 'State', true);
        const stateInput = document.createElement('input');
        stateInput.type = 'text';
        stateInput.id = 'barState';
        stateInput.name = 'state';
        stateInput.required = true;
        stateInput.placeholder = 'State';
        stateContainer.appendChild(stateInput);
        basicInfoSection.appendChild(stateContainer);
        
        // ZIP Code
        const zipContainer = createFieldContainer('barZipCode', 'ZIP Code');
        const zipInput = document.createElement('input');
        zipInput.type = 'text';
        zipInput.id = 'barZipCode';
        zipInput.name = 'zipCode';
        zipInput.placeholder = 'ZIP Code';
        zipContainer.appendChild(zipInput);
        basicInfoSection.appendChild(zipContainer);
        
        fields.push(basicInfoSection);
        
        // Contact Information Section
        const contactSection = document.createElement('div');
        contactSection.className = 'form-section';
        
        const contactTitle = document.createElement('h4');
        contactTitle.textContent = 'Contact Information';
        contactSection.appendChild(contactTitle);
        
        // Phone
        const phoneContainer = createFieldContainer('barPhone', 'Phone');
        const phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.id = 'barPhone';
        phoneInput.name = 'phone';
        phoneInput.placeholder = 'Phone number';
        phoneContainer.appendChild(phoneInput);
        contactSection.appendChild(phoneContainer);
        
        // Email
        const emailContainer = createFieldContainer('barEmail', 'Email');
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = 'barEmail';
        emailInput.name = 'email';
        emailInput.placeholder = 'Email address';
        emailContainer.appendChild(emailInput);
        contactSection.appendChild(emailContainer);
        
        // Website
        const websiteContainer = createFieldContainer('barWebsite', 'Website');
        const websiteInput = document.createElement('input');
        websiteInput.type = 'url';
        websiteInput.id = 'barWebsite';
        websiteInput.name = 'website';
        websiteInput.placeholder = 'Website URL';
        websiteContainer.appendChild(websiteInput);
        contactSection.appendChild(websiteContainer);
        
        fields.push(contactSection);
        
        // Business Details Section
        const businessSection = document.createElement('div');
        businessSection.className = 'form-section';
        
        const businessTitle = document.createElement('h4');
        businessTitle.textContent = 'Business Details';
        businessSection.appendChild(businessTitle);
        
        // POS System
        const posContainer = createFieldContainer('barPosSystem', 'POS System');
        const posSelect = document.createElement('select');
        posSelect.id = 'barPosSystem';
        posSelect.name = 'posSystem';
        
        const posSystems = [
            { value: '', label: 'Select POS System' },
            { value: 'Toast', label: 'Toast' },
            { value: 'Clover', label: 'Clover' },
            { value: 'Square', label: 'Square' },
            { value: 'Lightspeed', label: 'Lightspeed' },
            { value: 'Aloha', label: 'Aloha' },
            { value: 'TouchBistro', label: 'TouchBistro' },
            { value: 'Upserve', label: 'Upserve' },
            { value: 'Revel', label: 'Revel' },
            { value: 'Other', label: 'Other' },
            { value: 'None', label: 'None' }
        ];
        
        posSystems.forEach(system => {
            const option = document.createElement('option');
            option.value = system.value;
            option.textContent = system.label;
            posSelect.appendChild(option);
        });
        
        posContainer.appendChild(posSelect);
        businessSection.appendChild(posContainer);
        
        // Has Kitchen
        const kitchenContainer = createFieldContainer('barHasKitchen', 'Has Kitchen');
        const kitchenCheckbox = document.createElement('input');
        kitchenCheckbox.type = 'checkbox';
        kitchenCheckbox.id = 'barHasKitchen';
        kitchenCheckbox.name = 'hasKitchen';
        kitchenContainer.appendChild(kitchenCheckbox);
        businessSection.appendChild(kitchenContainer);
        
        // Live Music
        const musicContainer = createFieldContainer('barLiveMusic', 'Live Music');
        const musicCheckbox = document.createElement('input');
        musicCheckbox.type = 'checkbox';
        musicCheckbox.id = 'barLiveMusic';
        musicCheckbox.name = 'liveMusic';
        musicContainer.appendChild(musicCheckbox);
        businessSection.appendChild(musicContainer);
        
        // Specialties
        const specialtiesContainer = createFieldContainer('barSpecialties', 'Specialties');
        const specialtiesInput = document.createElement('input');
        specialtiesInput.type = 'text';
        specialtiesInput.id = 'barSpecialties';
        specialtiesInput.name = 'specialties';
        specialtiesInput.placeholder = 'Craft cocktails, local beers, etc. (comma separated)';
        specialtiesContainer.appendChild(specialtiesInput);
        businessSection.appendChild(specialtiesContainer);
        
        // Amenities
        const amenitiesContainer = createFieldContainer('barAmenities', 'Amenities');
        const amenitiesInput = document.createElement('input');
        amenitiesInput.type = 'text';
        amenitiesInput.id = 'barAmenities';
        amenitiesInput.name = 'amenities';
        amenitiesInput.placeholder = 'Pool tables, darts, TVs, etc. (comma separated)';
        amenitiesContainer.appendChild(amenitiesInput);
        businessSection.appendChild(amenitiesContainer);
        
        fields.push(businessSection);
        
        // Bar Staff Section
        const staffSection = document.createElement('div');
        staffSection.className = 'form-section';
        
        const staffTitle = document.createElement('h4');
        staffTitle.textContent = 'Management';
        staffSection.appendChild(staffTitle);
        
        // Manager Name
        const managerNameContainer = createFieldContainer('barManagerName', 'Manager Name');
        const managerNameInput = document.createElement('input');
        managerNameInput.type = 'text';
        managerNameInput.id = 'barManagerName';
        managerNameInput.name = 'managerName';
        managerNameInput.placeholder = 'Manager name';
        managerNameContainer.appendChild(managerNameInput);
        staffSection.appendChild(managerNameContainer);
        
        // Manager Email
        const managerEmailContainer = createFieldContainer('barManagerEmail', 'Manager Email');
        const managerEmailInput = document.createElement('input');
        managerEmailInput.type = 'email';
        managerEmailInput.id = 'barManagerEmail';
        managerEmailInput.name = 'managerEmail';
        managerEmailInput.placeholder = 'Manager email';
        managerEmailContainer.appendChild(managerEmailInput);
        staffSection.appendChild(managerEmailContainer);
        
        fields.push(staffSection);
        
        return fields;
    }
    
    /**
     * Handle form submission
     * @param {Event} e - The form submission event
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            const formData = new FormData(form);
            
            // Collect form data
            const barData = {
                name: formData.get('name'),
                type: formData.get('type'),
                location: {
                    address: formData.get('address'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    zipCode: formData.get('zipCode')
                },
                contact: {
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    website: formData.get('website')
                },
                posSystem: formData.get('posSystem'),
                barDetails: {
                    hasKitchen: formData.get('hasKitchen') === 'on',
                    liveMusic: formData.get('liveMusic') === 'on',
                    specialties: formData.get('specialties') ? formData.get('specialties').split(',').map(s => s.trim()) : [],
                    amenities: formData.get('amenities') ? formData.get('amenities').split(',').map(a => a.trim()) : []
                },
                manager: {
                    name: formData.get('managerName'),
                    email: formData.get('managerEmail')
                }
            };
            
            // If the current user exists, set them as the owner
            if (this.currentUser) {
                barData.owner = {
                    userId: this.currentUser.id,
                    name: this.currentUser.name,
                    email: this.currentUser.email
                };
            }
            
            // Create or update bar
            let bar;
            let success;
            
            if (this.editingBarId) {
                // Update existing bar
                bar = await BarModel.getById(this.editingBarId);
                if (bar) {
                    success = await bar.update(barData);
                    if (success) {
                        showNotification(`Bar "${barData.name}" updated successfully!`, 'success');
                    }
                } else {
                    showNotification('Bar not found. Creating a new one instead.', 'warning');
                    bar = new BarModel(barData);
                    success = await bar.saveToFirebase();
                    if (success) {
                        showNotification(`Bar "${barData.name}" created successfully!`, 'success');
                    }
                }
            } else {
                // Create new bar
                bar = new BarModel(barData);
                success = await bar.saveToFirebase();
                if (success) {
                    showNotification(`Bar "${barData.name}" created successfully!`, 'success');
                }
            }
            
            if (success) {
                // Reset form and refresh UI
                form.reset();
                this.editingBarId = null;
                this.createUi();
                
                // Reload bars if list exists
                if (this.barListElement) {
                    this.loadBars();
                }
                
                // Dispatch event that a bar was created/updated
                const event = new CustomEvent('barChanged', { 
                    detail: { bar: bar, action: this.editingBarId ? 'update' : 'create' } 
                });
                document.dispatchEvent(event);
            } else {
                showNotification('Failed to save bar. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error saving bar:', error);
            showNotification('An error occurred while saving the bar.', 'error');
        }
    }
    
    /**
     * Load bars from Firebase
     */
    async loadBars() {
        try {
            if (!this.barListElement) {
                console.warn('Bar list element not found. Cannot display bars.');
                return;
            }
            
            // Clear existing bars
            this.barListElement.innerHTML = '';
            
            // Get bars
            let bars = [];
            
            if (this.currentUser) {
                // If user is logged in, get their bars
                bars = await BarModel.getByOwnerId(this.currentUser.id);
                
                // If no bars found, get all active bars
                if (bars.length === 0) {
                    bars = await BarModel.getAllActive();
                }
            } else {
                // If no user, get all active bars
                bars = await BarModel.getAllActive();
            }
            
            this.bars = bars;
            
            // Display bars
            if (bars.length > 0) {
                bars.forEach(bar => {
                    const barItem = this.createBarListItem(bar);
                    this.barListElement.appendChild(barItem);
                });
            } else {
                // No bars found
                const noBar = document.createElement('div');
                noBar.className = 'no-bars-message';
                noBar.textContent = 'No bars found. Create a new one!';
                this.barListElement.appendChild(noBar);
            }
        } catch (error) {
            console.error('Error loading bars:', error);
            showNotification('Failed to load bars. Please try again.', 'error');
        }
    }
    
    /**
     * Create a bar list item
     * @param {BarModel} bar - The bar model
     * @returns {HTMLElement} - The bar list item element
     */
    createBarListItem(bar) {
        const item = document.createElement('div');
        item.className = 'bar-list-item';
        item.dataset.barId = bar.id;
        
        // Bar name
        const name = document.createElement('h4');
        name.textContent = bar.name;
        name.className = 'bar-list-item-name';
        item.appendChild(name);
        
        // Bar details
        const details = document.createElement('div');
        details.className = 'bar-list-item-details';
        
        // Bar type
        const type = document.createElement('span');
        type.textContent = this.formatBarType(bar.type);
        type.className = 'bar-list-item-type';
        details.appendChild(type);
        
        // Bar location
        if (bar.location && (bar.location.city || bar.location.state)) {
            const location = document.createElement('span');
            const locationText = [
                bar.location.city,
                bar.location.state
            ].filter(Boolean).join(', ');
            
            location.textContent = locationText;
            location.className = 'bar-list-item-location';
            details.appendChild(location);
        }
        
        item.appendChild(details);
        
        // Actions
        const actions = document.createElement('div');
        actions.className = 'bar-list-item-actions';
        
        // Edit button
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.className = 'btn btn-sm btn-primary bar-edit-btn';
        editButton.addEventListener('click', () => this.editBar(bar.id));
        actions.appendChild(editButton);
        
        // Select button
        const selectButton = document.createElement('button');
        selectButton.type = 'button';
        selectButton.textContent = 'Select';
        selectButton.className = 'btn btn-sm btn-secondary bar-select-btn';
        selectButton.addEventListener('click', () => this.selectBar(bar.id));
        actions.appendChild(selectButton);
        
        item.appendChild(actions);
        
        return item;
    }
    
    /**
     * Format bar type for display
     * @param {string} type - The bar type
     * @returns {string} - Formatted bar type
     */
    formatBarType(type) {
        if (!type) return 'Bar';
        
        // Replace underscores with spaces and capitalize each word
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
    
    /**
     * Edit a bar
     * @param {string} barId - The bar ID
     */
    async editBar(barId) {
        try {
            const bar = await BarModel.getById(barId);
            if (!bar) {
                showNotification('Bar not found.', 'error');
                return;
            }
            
            this.editingBarId = barId;
            this.createUi();
            
            // Fill form with bar data
            this.fillFormWithBarData(bar);
        } catch (error) {
            console.error('Error editing bar:', error);
            showNotification('Failed to load bar data for editing.', 'error');
        }
    }
    
    /**
     * Fill the form with bar data
     * @param {BarModel} bar - The bar model
     */
    fillFormWithBarData(bar) {
        const form = document.getElementById(this.formId);
        if (!form) return;
        
        // Set basic info
        form.elements.name.value = bar.name || '';
        form.elements.type.value = bar.type || 'bar';
        
        // Set location
        if (bar.location) {
            form.elements.address.value = bar.location.address || '';
            form.elements.city.value = bar.location.city || '';
            form.elements.state.value = bar.location.state || '';
            form.elements.zipCode.value = bar.location.zipCode || '';
        }
        
        // Set contact info
        if (bar.contact) {
            form.elements.phone.value = bar.contact.phone || '';
            form.elements.email.value = bar.contact.email || '';
            form.elements.website.value = bar.contact.website || '';
        }
        
        // Set POS system
        form.elements.posSystem.value = bar.posSystem || '';
        
        // Set bar details
        if (bar.barDetails) {
            form.elements.hasKitchen.checked = bar.barDetails.hasKitchen || false;
            form.elements.liveMusic.checked = bar.barDetails.liveMusic || false;
            
            if (bar.barDetails.specialties && Array.isArray(bar.barDetails.specialties)) {
                form.elements.specialties.value = bar.barDetails.specialties.join(', ');
            }
            
            if (bar.barDetails.amenities && Array.isArray(bar.barDetails.amenities)) {
                form.elements.amenities.value = bar.barDetails.amenities.join(', ');
            }
        }
        
        // Set manager info
        if (bar.manager) {
            form.elements.managerName.value = bar.manager.name || '';
            form.elements.managerEmail.value = bar.manager.email || '';
        }
    }
    
    /**
     * Cancel editing and return to creation mode
     */
    cancelEdit() {
        this.editingBarId = null;
        this.createUi();
    }
    
    /**
     * Select a bar
     * @param {string} barId - The bar ID
     */
    async selectBar(barId) {
        try {
            const bar = await BarModel.getById(barId);
            if (!bar) {
                showNotification('Bar not found.', 'error');
                return;
            }
            
            // Dispatch event that a bar was selected
            const event = new CustomEvent('barSelected', { detail: { bar } });
            document.dispatchEvent(event);
            
            showNotification(`Bar "${bar.name}" selected.`, 'success');
        } catch (error) {
            console.error('Error selecting bar:', error);
            showNotification('Failed to select bar.', 'error');
        }
    }
}

export default BarCreator;
