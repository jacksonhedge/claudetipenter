/**
 * Receipt Approval JavaScript
 * Handles the functionality for the receipt approval admin interface
 */

// Import Supabase service
import supabaseService from './services/supabaseService.js';

// Import date utilities
import { formatDateForSupabase, getDateRange, getReceiptsByDateRange } from '../date-utils.js';

// Import Firebase modules
import { 
    auth, 
    db, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc,
    addDoc,
    orderBy,
    limit,
    startAfter,
    onAuthStateChanged,
    serverTimestamp
} from './firebase-config.js';

// Initialize the receipt approval functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const receiptApproval = new ReceiptApproval();
});

/**
 * Receipt Approval Class
 * Manages the receipt approval functionality
 */
class ReceiptApproval {
    constructor() {
        // State
        this.currentUser = null;
        this.receipts = {
            pending: [],
            approved: [],
            rejected: [],
            storage: [] // Add storage array to track receipts from storage bin
        };
        this.establishments = [];
        this.users = [];
        this.currentTab = 'pending';
        this.currentReceiptId = null;
        this.pagination = {
            pending: { currentPage: 1, totalPages: 1, pageSize: 20 },
            approved: { currentPage: 1, totalPages: 1, pageSize: 20 },
            rejected: { currentPage: 1, totalPages: 1, pageSize: 20 }
        };
        this.filters = {
            pending: { dateRange: 'last7days', startDate: null, endDate: null, establishment: 'all', user: 'all' },
            approved: { dateRange: 'last7days', startDate: null, endDate: null, establishment: 'all', user: 'all' },
            rejected: { dateRange: 'last7days', startDate: null, endDate: null, establishment: 'all', user: 'all' }
        };
        this.settings = {
            autoApprove: false,
            approvalThreshold: 50.00,
            emailNotifications: true,
            notificationEmail: '',
            approvalUsers: []
        };
        
        // DOM Elements
        this.pendingTab = document.getElementById('pending-tab');
        this.approvedTab = document.getElementById('approved-tab');
        this.rejectedTab = document.getElementById('rejected-tab');
        this.settingsTab = document.getElementById('settings-tab');
        this.navItems = document.querySelectorAll('.admin-nav-item');
        this.receiptsList = document.getElementById('receipts-list');
        this.receiptDetail = document.getElementById('receipt-detail');
        this.pendingCount = document.getElementById('pending-count');
        this.approvedCount = document.getElementById('approved-count');
        this.rejectedCount = document.getElementById('rejected-count');
        this.totalTips = document.getElementById('total-tips');
        this.receiptModal = document.getElementById('receipt-modal');
        this.closeModal = document.querySelector('.close-modal');
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the component
     */
    async init() {
        // Check if admin login is enabled
        const isAdminLoginEnabled = document.getElementById('admin-login-overlay') !== null;
        
        if (isAdminLoginEnabled) {
            // Check if user is already logged in
            if (localStorage.getItem('admin_logged_in') === 'true') {
                document.getElementById('admin-login-overlay').style.display = 'none';
                document.getElementById('admin-container').style.display = 'flex';
                
                // Load mock data
                this.loadMockData();
                
                // Initialize UI
                this.initUI();
            }
        } else {
            // Use Firebase auth
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    try {
                        // Get user data from Firestore
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        
                        if (userDoc.exists()) {
                            this.currentUser = { id: user.uid, ...userDoc.data() };
                            
                            // Check if user is a manager or has approval permissions
                            if (this.currentUser.role !== 'manager' && !this.hasApprovalPermission(this.currentUser.email)) {
                                // Redirect to home page if not authorized
                                window.location.href = 'home.html';
                                return;
                            }
                            
                            // Load data
                            await this.loadData();
                            
                            // Initialize UI
                            this.initUI();
                        } else {
                            // Redirect to login page if user data doesn't exist
                            window.location.href = 'login.html';
                        }
                    } catch (error) {
                        console.error('Error getting user data:', error);
                        this.showError('Failed to load user data. Please try again later.');
                    }
                } else {
                    // Redirect to login page if not authenticated
                    window.location.href = 'login.html';
                }
            });
        }
    }
    
    /**
     * Initialize UI elements and event listeners
     */
    initUI() {
        // Set up test storage button
        const testStorageBtn = document.getElementById('test-storage-btn');
        if (testStorageBtn) {
            testStorageBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // Confirm before running the test
                if (confirm('This will scan the Supabase storage bin for receipt images and add them to the database. Continue?')) {
                    try {
                        // Show loading message
                        alert('Loading receipts from storage bin. This may take a moment...');
                        
                        // Load receipts from storage
                        const newReceipts = await this.loadReceiptsFromStorage();
                        
                        // Reload pending receipts
                        await this.loadReceipts('pending');
                        
                        // Show success message
                        alert(`Successfully processed ${newReceipts.length} new receipts from storage.`);
                    } catch (error) {
                        console.error('Error testing storage:', error);
                        alert(`Error loading receipts from storage: ${error.message}`);
                    }
                }
            });
        }
        
        // Set up tab navigation
        this.navItems.forEach(item => {
            if (item.getAttribute('data-tab')) {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Remove active class from all nav items
                    this.navItems.forEach(navItem => {
                        navItem.classList.remove('active');
                    });
                    
                    // Add active class to clicked nav item
                    item.classList.add('active');
                    
                    // Get the tab to show
                    const tabId = item.getAttribute('data-tab');
                    this.currentTab = tabId.replace('-tab', '');
                    
                    // Hide all tabs
                    document.querySelectorAll('.tab-content').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    
                    // Show the selected tab
                    document.getElementById(tabId).classList.add('active');
                });
            }
        });
        
        // Set up date filter change handlers
        document.getElementById('date-filter').addEventListener('change', (e) => {
            this.handleDateFilterChange(e, 'pending');
        });
        
        document.getElementById('approved-date-filter').addEventListener('change', (e) => {
            this.handleDateFilterChange(e, 'approved');
        });
        
        document.getElementById('rejected-date-filter').addEventListener('change', (e) => {
            this.handleDateFilterChange(e, 'rejected');
        });
        
        // Set up filter buttons
        document.getElementById('apply-filters-btn').addEventListener('click', () => {
            this.applyFilters('pending');
        });
        
        document.getElementById('reset-filters-btn').addEventListener('click', () => {
            this.resetFilters('pending');
        });
        
        // Set up modal
        this.closeModal.addEventListener('click', () => {
            this.receiptModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === this.receiptModal) {
                this.receiptModal.style.display = 'none';
            }
        });
        
        // Set up rejection reason dropdown
        document.getElementById('rejection-reason').addEventListener('change', (e) => {
            const otherReasonGroup = document.getElementById('other-reason-group');
            if (e.target.value === 'Other') {
                otherReasonGroup.style.display = 'block';
            } else {
                otherReasonGroup.style.display = 'none';
            }
        });
        
        // Set up approve/reject buttons
        document.getElementById('approve-receipt-btn').addEventListener('click', () => {
            this.approveReceipt();
        });
        
        document.getElementById('reject-receipt-btn').addEventListener('click', () => {
            this.rejectReceipt();
        });
        
        // Load settings
        this.loadSettings();
        
        // Render initial data
        this.renderPendingReceipts();
        this.renderApprovedReceipts();
        this.renderRejectedReceipts();
        this.updateStats();
    }
    
    /**
     * Load data from Supabase and Firebase
     */
    async loadData() {
        try {
            // Load establishments
            await this.loadEstablishments();
            
            // Load users
            await this.loadUsers();
            
            // Load receipts from storage bin
            await this.loadReceiptsFromStorage();
            
            // Load receipts
            await this.loadReceipts('pending');
            await this.loadReceipts('approved');
            await this.loadReceipts('rejected');
            
            // Load settings
            await this.loadSettings();
            
            // Update stats
            this.updateStats();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please try again later.');
        }
    }
    
    /**
     * Load establishments from Supabase
     */
    async loadEstablishments() {
        try {
            // Get establishments from Supabase
            const { data, error } = await supabaseService.supabase
                .from('profiles')
                .select('establishment')
                .not('establishment', 'is', null)
                .order('establishment');
            
            if (error) throw error;
            
            // Extract unique establishments
            const uniqueEstablishments = [...new Set(data.map(item => item.establishment))];
            
            this.establishments = uniqueEstablishments;
            
            // Populate establishment dropdowns
            this.populateEstablishmentDropdowns();
        } catch (error) {
            console.error('Error loading establishments:', error);
            throw error;
        }
    }
    
    /**
     * Load users from Supabase
     */
    async loadUsers() {
        try {
            // Get users from Supabase
            const { data, error } = await supabaseService.supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name');
            
            if (error) throw error;
            
            this.users = data;
            
            // Populate user dropdowns
            this.populateUserDropdowns();
        } catch (error) {
            console.error('Error loading users:', error);
            throw error;
        }
    }
    
    /**
     * Load receipts from Supabase
     * @param {string} status - Receipt status (pending, approved, rejected)
     */
    async loadReceipts(status) {
        try {
            // Get date range for filter
            const dateRange = this.getDateRangeFilter(this.filters[status].dateRange);
            
            // Build query
            let query = supabaseService.supabase
                .from('receipts')
                .select(`
                    *,
                    profiles:user_id (full_name, email, establishment)
                `);
            
            // Add status filter
            if (status === 'pending') {
                query = query.is('approval_status', null);
            } else if (status === 'approved') {
                query = query.eq('approval_status', 'approved');
            } else if (status === 'rejected') {
                query = query.eq('approval_status', 'rejected');
            }
            
            // Add date filter
            if (dateRange.startDate && dateRange.endDate) {
                query = query.gte('created_at', dateRange.startDate.toISOString())
                    .lte('created_at', dateRange.endDate.toISOString());
            }
            
            // Add establishment filter
            if (this.filters[status].establishment !== 'all') {
                query = query.eq('profiles.establishment', this.filters[status].establishment);
            }
            
            // Add user filter
            if (this.filters[status].user !== 'all') {
                query = query.eq('user_id', this.filters[status].user);
            }
            
            // Add pagination
            query = query.order('created_at', { ascending: false })
                .range(
                    (this.pagination[status].currentPage - 1) * this.pagination[status].pageSize,
                    this.pagination[status].currentPage * this.pagination[status].pageSize - 1
                );
            
            // Execute query
            const { data, error, count } = await query;
            
            if (error) throw error;
            
            // Update receipts
            this.receipts[status] = data || [];
            
            // Update pagination
            if (count) {
                this.pagination[status].totalPages = Math.ceil(count / this.pagination[status].pageSize);
            }
            
            // Update UI
            if (status === 'pending') {
                this.renderPendingReceipts();
            } else if (status === 'approved') {
                this.renderApprovedReceipts();
            } else if (status === 'rejected') {
                this.renderRejectedReceipts();
            }
        } catch (error) {
            console.error(`Error loading ${status} receipts:`, error);
            throw error;
        }
    }
    
    /**
     * Load receipts from Supabase storage bin
     */
    async loadReceiptsFromStorage() {
        try {
            console.log('Loading receipts from storage bin...');
            
            // Get list of files from the receipt-images storage bucket
            const { data: files, error: listError } = await supabaseService.supabase
                .storage
                .from('receipt-images')
                .list();
            
            if (listError) throw listError;
            
            console.log(`Found ${files.length} files in storage bin`);
            
            // Filter for image files
            const imageFiles = files.filter(file => {
                const extension = file.name.split('.').pop().toLowerCase();
                return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
            });
            
            // Process each image file
            for (const file of imageFiles) {
                // Check if this file has already been processed
                const { data: existingReceipts, error: checkError } = await supabaseService.supabase
                    .from('receipts')
                    .select('id')
                    .eq('image_url', `${supabaseService.supabase.storage.from('receipt-images').getPublicUrl(file.name).data.publicUrl}`);
                
                if (checkError) throw checkError;
                
                // Skip if already processed
                if (existingReceipts && existingReceipts.length > 0) {
                    console.log(`Skipping already processed file: ${file.name}`);
                    continue;
                }
                
                // Get user ID from file path (assuming format: userId/timestamp.ext)
                const userId = file.name.split('/')[0];
                
                // Get user profile
                const { data: userProfile, error: userError } = await supabaseService.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
                
                if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found" error
                    console.warn(`Error getting user profile for ${userId}:`, userError);
                }
                
                // Get public URL for the image
                const publicUrl = supabaseService.supabase
                    .storage
                    .from('receipt-images')
                    .getPublicUrl(file.name).data.publicUrl;
                
                // Create a new receipt record
                const newReceipt = {
                    user_id: userId,
                    image_url: publicUrl,
                    created_at: new Date().toISOString(),
                    // Set default values for other fields
                    customer_name: userProfile?.full_name || 'Unknown',
                    date: new Date().toLocaleDateString(),
                    time: new Date().toLocaleTimeString(),
                    check_number: '',
                    amount: '$0.00',
                    tip: '$0.00',
                    total: '$0.00',
                    payment_type: '',
                    signed: 'false',
                    approval_status: null
                };
                
                // Insert the new receipt
                const { data: insertedReceipt, error: insertError } = await supabaseService.supabase
                    .from('receipts')
                    .insert([newReceipt])
                    .select();
                
                if (insertError) {
                    console.error(`Error inserting receipt for ${file.name}:`, insertError);
                    continue;
                }
                
                console.log(`Added new receipt from storage: ${file.name}`);
                
                // Add to storage receipts array
                if (insertedReceipt && insertedReceipt.length > 0) {
                    this.receipts.storage.push({
                        ...insertedReceipt[0],
                        profiles: userProfile
                    });
                }
            }
            
            console.log(`Processed ${this.receipts.storage.length} new receipts from storage`);
            return this.receipts.storage;
        } catch (error) {
            console.error('Error loading receipts from storage:', error);
            throw error;
        }
    }
    
    /**
     * Load settings from localStorage or set defaults
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('receipt_approval_settings');
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
            }
            
            // Update settings UI
            document.getElementById('auto-approve-toggle').checked = this.settings.autoApprove;
            document.getElementById('approval-threshold').value = this.settings.approvalThreshold;
            document.getElementById('notification-toggle').checked = this.settings.emailNotifications;
            document.getElementById('notification-email').value = this.settings.notificationEmail;
            
            // Render approval users
            this.renderApprovalUsers();
        } catch (error) {
            console.error('Error loading settings:', error);
            // Use default settings
        }
    }
    
    /**
     * Render approval users in settings
     */
    renderApprovalUsers() {
        const permissionUsers = document.querySelector('.permission-users');
        if (!permissionUsers) return;
        
        permissionUsers.innerHTML = '';
        
        this.settings.approvalUsers.forEach(email => {
            const userElement = document.createElement('div');
            userElement.className = 'permission-user';
            userElement.innerHTML = `
                <span class="user-email">${email}</span>
                <button class="remove-user-btn" data-email="${email}"><i class="fas fa-times"></i></button>
            `;
            permissionUsers.appendChild(userElement);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const email = e.currentTarget.getAttribute('data-email');
                this.settings.approvalUsers = this.settings.approvalUsers.filter(item => item !== email);
                this.renderApprovalUsers();
            });
        });
    }
    
    /**
     * Check if user has approval permission
     * @param {string} email - User email
     * @returns {boolean} - Whether user has approval permission
     */
    hasApprovalPermission(email) {
        return this.settings.approvalUsers.includes(email);
    }
    
    /**
     * Populate establishment dropdowns
     */
    populateEstablishmentDropdowns() {
        const dropdowns = [
            document.getElementById('establishment-filter'),
            document.getElementById('approved-establishment-filter'),
            document.getElementById('rejected-establishment-filter')
        ];
        
        dropdowns.forEach(dropdown => {
            if (!dropdown) return;
            
            // Clear existing options except the first one
            while (dropdown.options.length > 1) {
                dropdown.remove(1);
            }
            
            // Add establishment options
            this.establishments.forEach(establishment => {
                const option = document.createElement('option');
                option.value = establishment;
                option.textContent = establishment;
                dropdown.appendChild(option);
            });
        });
    }
    
    /**
     * Populate user dropdowns
     */
    populateUserDropdowns() {
        const dropdowns = [
            document.getElementById('user-filter'),
            document.getElementById('approved-user-filter'),
            document.getElementById('rejected-user-filter')
        ];
        
        dropdowns.forEach(dropdown => {
            if (!dropdown) return;
            
            // Clear existing options except the first one
            while (dropdown.options.length > 1) {
                dropdown.remove(1);
            }
            
            // Add user options
            this.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.full_name || user.email;
                dropdown.appendChild(option);
            });
        });
    }
    
    /**
     * Create a placeholder element for receipt images
     * @param {string} text - Text to display in the placeholder
     * @param {HTMLElement} container - Container to add the placeholder to
     * @returns {HTMLElement} - The created placeholder element
     */
    createPlaceholderElement(text, container) {
        // Clear the container
        if (container) {
            container.innerHTML = '';
        }
        
        // Create a div for the placeholder
        const placeholder = document.createElement('div');
        placeholder.style.width = '100%';
        placeholder.style.height = '100%';
        placeholder.style.backgroundColor = '#f0f0f0';
        placeholder.style.border = '5px solid #999999';
        placeholder.style.display = 'flex';
        placeholder.style.justifyContent = 'center';
        placeholder.style.alignItems = 'center';
        placeholder.style.textAlign = 'center';
        placeholder.style.padding = '20px';
        placeholder.style.boxSizing = 'border-box';
        
        // Create text element
        const textElement = document.createElement('p');
        textElement.textContent = text;
        textElement.style.color = '#333333';
        textElement.style.fontSize = '18px';
        textElement.style.fontWeight = 'bold';
        textElement.style.margin = '0';
        
        // Add text to placeholder
        placeholder.appendChild(textElement);
        
        // Add placeholder to container if provided
        if (container) {
            container.appendChild(placeholder);
        }
        
        return placeholder;
    }
    
    /**
     * Create receipt image or placeholder
     * @param {Object} receipt - Receipt object
     * @returns {string} - HTML for the image or placeholder
     */
    createReceiptImageOrPlaceholder(receipt) {
        if (!receipt.image_url) {
            return `<div class="receipt-placeholder">
                <p>No Receipt Image Available</p>
                <p>Customer: ${receipt.customer_name || 'Unknown'}</p>
            </div>`;
        }
        
        return `<img src="${receipt.image_url}" alt="Receipt Image" class="receipt-image-full"
            onerror="
                this.onerror=null; 
                this.style.display='none';
                const container = this.parentElement;
                const placeholder = document.createElement('div');
                placeholder.className = 'receipt-placeholder';
                placeholder.innerHTML = '<p>Image Not Found</p><p>Customer: ${receipt.customer_name || 'Unknown'}</p>';
                container.appendChild(placeholder);
            ">`;
    }
    
    /**
     * Render pending receipts
     */
    renderPendingReceipts() {
        if (!this.receiptsList) return;
        
        // Clear existing receipts
        this.receiptsList.innerHTML = '';
        
        if (this.receipts.pending.length === 0) {
            this.receiptsList.innerHTML = '<div class="loading-message">No pending receipts found</div>';
            return;
        }
        
        // Render each receipt
        this.receipts.pending.forEach(receipt => {
            const receiptItem = document.createElement('div');
            receiptItem.className = 'receipt-item';
            receiptItem.setAttribute('data-id', receipt.id);
            
            // Format date and time
            const date = new Date(receipt.created_at);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Format amount and tip
            const amount = receipt.amount || '$0.00';
            const tip = receipt.tip || '$0.00';
            
            receiptItem.innerHTML = `
                <div class="receipt-header">
                    <div class="receipt-date">${formattedDate}</div>
                    <div class="receipt-time">${formattedTime}</div>
                </div>
                <div class="receipt-user">${receipt.profiles?.full_name || 'Unknown User'}</div>
                <div class="receipt-establishment">${receipt.profiles?.establishment || 'Unknown Establishment'}</div>
                <div class="receipt-details">
                    <div class="receipt-check">#${receipt.check_number || 'N/A'}</div>
                    <div class="receipt-amount">${amount}</div>
                </div>
                <div class="receipt-tip">${tip}</div>
            `;
            
            // Add click event to show receipt details
            receiptItem.addEventListener('click', () => {
                this.showReceiptDetails(receipt.id);
                
                // Add active class to clicked item
                document.querySelectorAll('.receipt-item').forEach(item => {
                    item.classList.remove('active');
                });
                receiptItem.classList.add('active');
            });
            
            this.receiptsList.appendChild(receiptItem);
        });
        
        // Update pagination
        document.getElementById('page-info').textContent = `Page ${this.pagination.pending.currentPage} of ${this.pagination.pending.totalPages}`;
        document.getElementById('prev-page').disabled = this.pagination.pending.currentPage <= 1;
        document.getElementById('next-page').disabled = this.pagination.pending.currentPage >= this.pagination.pending.totalPages;
    }
    
    /**
     * Render approved receipts
     */
    renderApprovedReceipts() {
        const tableBody = document.getElementById('approved-table-body');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (this.receipts.approved.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="11" class="loading-message">No approved receipts found</td></tr>';
            return;
        }
        
        // Render each receipt
        this.receipts.approved.forEach(receipt => {
            const row = document.createElement('tr');
            
            // Format date and time
            const date = new Date(receipt.created_at);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>${receipt.profiles?.full_name || 'Unknown User'}</td>
                <td>${receipt.profiles?.establishment || 'Unknown Establishment'}</td>
                <td>${receipt.customer_name || 'N/A'}</td>
                <td>${receipt.check_number || 'N/A'}</td>
                <td>${receipt.amount || '$0.00'}</td>
                <td>${receipt.tip || '$0.00'}</td>
                <td>${receipt.total || '$0.00'}</td>
                <td>${receipt.approved_by || 'System'}</td>
                <td>
                    ${receipt.image_url ? 
                        `<img src="${receipt.image_url}" alt="Receipt" class="receipt-thumbnail" 
                            onerror="this.onerror=null; this.classList.add('image-error'); this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><rect width=%2260%22 height=%2260%22 fill=%22%23f8f9fa%22 /><text x=%2230%22 y=%2230%22 font-size=%2210%22 text-anchor=%22middle%22 alignment-baseline=%22middle%22 fill=%22%23dc3545%22>Image Not Found</text></svg>';" 
                            onclick="event.preventDefault(); 
                                    const img = new Image();
                                    img.onload = function() { window.open('${receipt.image_url}', '_blank'); };
                                    img.onerror = function() { alert('Image could not be loaded. The original file may no longer exist.'); };
                                    img.src = '${receipt.image_url}';">` 
                        : 'No image'}
                </td>
                <td>
                    <button class="action-btn view-btn" data-id="${receipt.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            // Add event listener to view button
            row.querySelector('.view-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showReceiptModal(receipt.id);
            });
            
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Render rejected receipts
     */
    renderRejectedReceipts() {
        const tableBody = document.getElementById('rejected-table-body');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (this.receipts.rejected.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="12" class="loading-message">No rejected receipts found</td></tr>';
            return;
        }
        
        // Render each receipt
        this.receipts.rejected.forEach(receipt => {
            const row = document.createElement('tr');
            
            // Format date and time
            const date = new Date(receipt.created_at);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>${receipt.profiles?.full_name || 'Unknown User'}</td>
                <td>${receipt.profiles?.establishment || 'Unknown Establishment'}</td>
                <td>${receipt.customer_name || 'N/A'}</td>
                <td>${receipt.check_number || 'N/A'}</td>
                <td>${receipt.amount || '$0.00'}</td>
                <td>${receipt.tip || '$0.00'}</td>
                <td>${receipt.total || '$0.00'}</td>
                <td>${receipt.rejected_by || 'System'}</td>
                <td>${receipt.rejection_reason || 'N/A'}</td>
                <td>
                    ${receipt.image_url ? 
                        `<div class="receipt-thumbnail-container">
                            ${this.createReceiptImageOrPlaceholder(receipt)}
                        </div>` 
                        : 'No image'}
                </td>
                <td>
                    <button class="action-btn view-btn" data-id="${receipt.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            // Add event listener to view button
            row.querySelector('.view-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showReceiptModal(receipt.id);
            });
            
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Show receipt details in the detail panel
     * @param {string} receiptId - Receipt ID
     */
    showReceiptDetails(receiptId) {
        if (!this.receiptDetail) return;
        
        // Find the receipt
        const receipt = this.receipts.pending.find(r => r.id === receiptId);
        if (!receipt) return;
        
        // Store current receipt ID
        this.currentReceiptId = receiptId;
        
        // Format date and time
        const date = new Date(receipt.created_at);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Format amount, tip, and total
        const amount = receipt.amount || '$0.00';
        const tip = receipt.tip || '$0.00';
        const total = receipt.total || '$0.00';
        
        // Create receipt detail HTML
        this.receiptDetail.innerHTML = `
            <div class="receipt-detail-header">
                <h3>Receipt Details</h3>
                <div class="receipt-actions">
                    <button id="detail-approve-btn" class="approve-btn">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button id="detail-reject-btn" class="reject-btn">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button id="detail-view-btn" class="view-btn">
                        <i class="fas fa-eye"></i> View Full
                    </button>
                </div>
            </div>
            
            <div class="receipt-info">
                <div class="receipt-info-section">
                    <h4>Receipt Information</h4>
                    <div class="receipt-info-grid">
                        <div class="info-group">
                            <label>Date</label>
                            <div class="info-value">${formattedDate}</div>
                        </div>
                        <div class="info-group">
                            <label>Time</label>
                            <div class="info-value">${formattedTime}</div>
                        </div>
                        <div class="info-group">
                            <label>Check #</label>
                            <div class="info-value">${receipt.check_number || 'N/A'}</div>
                        </div>
                        <div class="info-group">
                            <label>Customer</label>
                            <div class="info-value">${receipt.customer_name || 'N/A'}</div>
                        </div>
                        <div class="info-group">
                            <label>Payment Type</label>
                            <div class="info-value">${receipt.payment_type || 'N/A'}</div>
                        </div>
                        <div class="info-group">
                            <label>Amount</label>
                            <div class="info-value">${amount}</div>
                        </div>
                        <div class="info-group">
                            <label>Tip</label>
                            <div class="info-value">${tip}</div>
                        </div>
                        <div class="info-group">
                            <label>Total</label>
                            <div class="info-value">${total}</div>
                        </div>
                    </div>
                </div>
                
                <div class="receipt-info-section">
                    <h4>User Information</h4>
                    <div class="receipt-info-grid">
                        <div class="info-group">
                            <label>User</label>
                            <div class="info-value">${receipt.profiles?.full_name || receipt.profiles?.email || 'Unknown User'}</div>
                        </div>
                        <div class="info-group">
                            <label>Establishment</label>
                            <div class="info-value">${receipt.profiles?.establishment || 'Unknown Establishment'}</div>
                        </div>
                        <div class="info-group">
                            <label>Submitted</label>
                            <div class="info-value">${formattedDate} ${formattedTime}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="receipt-image" id="receipt-detail-image-container">
                ${this.createReceiptImageOrPlaceholder(receipt)}
            </div>
        `;
        
        // Add event listeners to detail buttons
        document.getElementById('detail-approve-btn').addEventListener('click', () => {
            this.approveReceipt();
        });
        
        document.getElementById('detail-reject-btn').addEventListener('click', () => {
            this.rejectReceipt();
        });
        
        document.getElementById('detail-view-btn').addEventListener('click', () => {
            this.showReceiptModal(receiptId);
        });
    }
    
    /**
     * Get date range filter based on selected option
     * @param {string} dateRangeOption - Date range option (today, yesterday, last7days, thisMonth, lastMonth, custom)
     * @returns {object} - Date range object with startDate and endDate
     */
    getDateRangeFilter(dateRangeOption) {
        // Use our date-utils function
        return getDateRange(dateRangeOption);
    }
    
    /**
     * Handle date filter change
     * @param {Event} e - Change event
     * @param {string} status - Receipt status (pending, approved, rejected)
     */
    handleDateFilterChange(e, status) {
        const dateRangeOption = e.target.value;
        this.filters[status].dateRange = dateRangeOption;
        
        // Update date range
        const dateRange = this.getDateRangeFilter(dateRangeOption);
        this.filters[status].startDate = dateRange.startDate;
        this.filters[status].endDate = dateRange.endDate;
        
        // Reload receipts
        this.loadReceipts(status);
    }
    
    /**
     * Apply filters to receipts
     * @param {string} status - Receipt status (pending, approved, rejected)
     */
    applyFilters(status) {
        // Get filter values
        const establishmentFilter = document.getElementById(`${status === 'pending' ? '' : status + '-'}establishment-filter`).value;
        const userFilter = document.getElementById(`${status === 'pending' ? '' : status + '-'}user-filter`).value;
        
        // Update filters
        this.filters[status].establishment = establishmentFilter;
        this.filters[status].user = userFilter;
        
        // Reset pagination
        this.pagination[status].currentPage = 1;
        
        // Reload receipts
        this.loadReceipts(status);
    }
    
    /**
     * Reset filters to default values
     * @param {string} status - Receipt status (pending, approved, rejected)
     */
    resetFilters(status) {
        // Reset filters to default values
        this.filters[status] = {
            dateRange: 'last7days',
            startDate: null,
            endDate: null,
            establishment: 'all',
            user: 'all'
        };
        
        // Reset UI
        document.getElementById(`${status === 'pending' ? '' : status + '-'}date-filter`).value = 'last7days';
        document.getElementById(`${status === 'pending' ? '' : status + '-'}establishment-filter`).value = 'all';
        document.getElementById(`${status === 'pending' ? '' : status + '-'}user-filter`).value = 'all';
        
        // Reset pagination
        this.pagination[status].currentPage = 1;
        
        // Reload receipts
        this.loadReceipts(status);
    }
    
    /**
     * Update statistics display
     */
    updateStats() {
        // Update counts
        if (this.pendingCount) this.pendingCount.textContent = this.receipts.pending.length;
        if (this.approvedCount) this.approvedCount.textContent = this.receipts.approved.length;
        if (this.rejectedCount) this.rejectedCount.textContent = this.receipts.rejected.length;
        
        // Calculate total tips
        const totalTipsAmount = this.receipts.approved.reduce((sum, receipt) => {
            // Extract numeric value from tip string
            const tipStr = receipt.tip || '0';
            const tipValue = parseFloat(tipStr.replace(/[^0-9.-]+/g, '')) || 0;
            return sum + tipValue;
        }, 0);
        
        // Update total tips display
        if (this.totalTips) this.totalTips.textContent = `$${totalTipsAmount.toFixed(2)}`;
    }
}
