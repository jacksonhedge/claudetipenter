/**
 * Subscription Service
 * Handles user subscription management and feature access
 */

class SubscriptionService {
  // Subscription tiers and limits
  static TIERS = {
    FREE: {
      name: 'Free',
      scanLimit: 15,
      printerLimit: 1,
      features: ['basic_analytics', 'manual_export'],
      price: 0
    },
    BARTENDER: {
      name: 'Bartender',
      scanLimit: -1, // Unlimited
      printerLimit: 2,
      features: ['basic_analytics', 'advanced_analytics', 'auto_export', 'cloud_storage'],
      price: 4.99
    },
    RESTAURANT: {
      name: 'Restaurant',
      scanLimit: -1, // Unlimited
      printerLimit: 5,
      features: ['basic_analytics', 'advanced_analytics', 'auto_export', 'priority_support', 'team_analytics', 'multi_user', 'scanner_included', 'google_drive_integration'],
      price: 89.99,
      userLimit: 5,
      includesScanner: true
    }
  };

  constructor(apiClient) {
    this.apiClient = apiClient;
    this.currentUser = null;
    this.userSubscription = null;
  }

  /**
   * Initialize the subscription service
   */
  async initialize() {
    try {
      if (localStorage.getItem('auth_token')) {
        await this.fetchUserSubscription();
      }
      return true;
    } catch (error) {
      console.error('Error initializing subscription service:', error);
      return false;
    }
  }

  /**
   * Fetch current user's subscription details
   */
  async fetchUserSubscription() {
    try {
      // In a real implementation, this would call your backend API
      const response = await this.apiClient.get('/api/subscription');
      
      if (response.data && response.data.success) {
        this.currentUser = response.data.user;
        this.userSubscription = response.data.subscription;
        
        // Store scan count in local storage for quick access
        localStorage.setItem('scan_count', this.currentUser.scan_count);
        localStorage.setItem('subscription_tier', this.userSubscription.tier);
      }
      
      return this.userSubscription;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to a specific feature
   * @param {string} feature - Feature to check access for
   * @returns {boolean} Whether user has access to the feature
   */
  canAccessFeature(feature) {
    if (!this.userSubscription) return false;
    
    const tierDetails = SubscriptionService.TIERS[this.userSubscription.tier];
    return tierDetails && tierDetails.features.includes(feature);
  }

  /**
   * Check if user has scans remaining in their current plan
   * @returns {boolean} Whether user has scans remaining
   */
  hasScansRemaining() {
    if (!this.currentUser || !this.userSubscription) return false;
    
    const tierDetails = SubscriptionService.TIERS[this.userSubscription.tier];
    
    // Unlimited scans
    if (tierDetails.scanLimit === -1) return true;
    
    // Check against limit
    return this.currentUser.scan_count < tierDetails.scanLimit;
  }

  /**
   * Get remaining scan count for current billing period
   * @returns {number} Number of scans remaining (or -1 for unlimited)
   */
  getRemainingScans() {
    if (!this.currentUser || !this.userSubscription) return 0;
    
    const tierDetails = SubscriptionService.TIERS[this.userSubscription.tier];
    
    // Unlimited scans
    if (tierDetails.scanLimit === -1) return -1;
    
    // Calculate remaining
    return Math.max(0, tierDetails.scanLimit - this.currentUser.scan_count);
  }

  /**
   * Record usage of scan feature
   */
  async recordScanUsage(count = 1) {
    try {
      if (!this.currentUser) throw new Error('User not authenticated');
      
      // In a real implementation, this would call your backend API
      const response = await this.apiClient.post('/api/usage/scan', { count });
      
      if (response.data && response.data.success) {
        this.currentUser.scan_count = response.data.new_scan_count;
        localStorage.setItem('scan_count', this.currentUser.scan_count);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error recording scan usage:', error);
      throw error;
    }
  }

  /**
   * Check if a user can connect to additional printers
   * @returns {boolean} Whether user can connect more printers
   */
  canConnectMorePrinters(currentPrinterCount) {
    if (!this.userSubscription) return false;
    
    const tierDetails = SubscriptionService.TIERS[this.userSubscription.tier];
    return currentPrinterCount < tierDetails.printerLimit;
  }

  /**
   * Get subscription details for display
   */
  getSubscriptionDetails() {
    if (!this.userSubscription) {
      return {
        tier: 'FREE',
        status: 'inactive',
        renewalDate: null,
        features: SubscriptionService.TIERS.FREE.features
      };
    }
    
    return {
      tier: this.userSubscription.tier,
      status: this.userSubscription.status,
      renewalDate: this.userSubscription.renewal_date,
      features: SubscriptionService.TIERS[this.userSubscription.tier].features
    };
  }

  /**
   * Upgrade subscription tier
   * @param {string} newTier - Target subscription tier
   */
  async upgradeSubscription(newTier) {
    try {
      // In a real implementation, this would call your backend API
      const response = await this.apiClient.post('/api/subscription/upgrade', { 
        tier: newTier 
      });
      
      if (response.data && response.data.success) {
        this.userSubscription = response.data.subscription;
        localStorage.setItem('subscription_tier', this.userSubscription.tier);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Add complimentary scans to a user account
   * @param {number} scanCount - Number of scans to add
   * @returns {Promise<Object>} Result of the operation
   */
  async addComplimentaryScans(userId, scanCount) {
    try {
      // This would typically be an admin-only function
      const response = await this.apiClient.post('/api/admin/add-scans', {
        userId,
        scanCount
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding complimentary scans:', error);
      throw error;
    }
  }
}

export default SubscriptionService;
