import React, { useState, useEffect } from 'react';
// Use lucide icons from global lucide object instead of importing from lucide-react
const { CreditCard, Check, AlertCircle, Zap } = lucide;

// Mock API client for demonstration
const mockApiClient = {
  get: async (url) => {
    // Simulate API response
    if (url === '/api/subscription') {
      return {
        data: {
          success: true,
          user: {
            id: 'user_123',
            name: 'John Smith',
            email: 'john@example.com',
            scan_count: 8
          },
          subscription: {
            tier: 'FREE',
            status: 'active',
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      };
    }
    return { data: { success: false } };
  },
  post: async (url, data) => {
    // Simulate successful API response
    return {
      data: {
        success: true
      }
    };
  }
};

// Create a mock subscription service (in production, use your real one)
class SubscriptionService {
  static TIERS = {
    FREE: {
      name: 'Free',
      scanLimit: 15,
      printerLimit: 1,
      features: ['Basic Analytics', 'Manual Export'],
      price: 0
    },
    BARTENDER: {
      name: 'Bartender',
      scanLimit: -1, // Unlimited
      printerLimit: 2,
      features: ['Unlimited Scans', 'Advanced Analytics', 'Auto Exports', 'Personal Cloud Storage'],
      price: 4.99
    },
    RESTAURANT: {
      name: 'Restaurant',
      scanLimit: -1, // Unlimited
      printerLimit: 5,
      features: ['Everything in Bartender Plan', 'Scanner Included', 'Google Drive Integration', 'Team Access (5 Users)', 'Priority Support'],
      price: 89.99,
      includesScanner: true
    }
  };

  constructor() {
    this.currentUser = null;
    this.userSubscription = null;
  }

  async initialize() {
    const response = await mockApiClient.get('/api/subscription');
    if (response.data.success) {
      this.currentUser = response.data.user;
      this.userSubscription = response.data.subscription;
    }
    return true;
  }

  getRemainingScans() {
    if (!this.currentUser || !this.userSubscription) return 0;
    const tierDetails = SubscriptionService.TIERS[this.userSubscription.tier];
    if (tierDetails.scanLimit === -1) return -1;
    return Math.max(0, tierDetails.scanLimit - this.currentUser.scan_count);
  }

  getSubscriptionDetails() {
    if (!this.userSubscription) {
      return {
        tier: 'FREE',
        status: 'inactive',
        renewalDate: null
      };
    }
    
    return {
      tier: this.userSubscription.tier,
      status: this.userSubscription.status,
      renewalDate: this.userSubscription.renewal_date,
      scanCount: this.currentUser.scan_count
    };
  }
}

const SubscriptionComponent = () => {
  const [subscriptionService] = useState(new SubscriptionService());
  const [initialized, setInitialized] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [remainingScans, setRemainingScans] = useState(0);
  const [selectedTier, setSelectedTier] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      await subscriptionService.initialize();
      setSubscriptionDetails(subscriptionService.getSubscriptionDetails());
      setRemainingScans(subscriptionService.getRemainingScans());
      setInitialized(true);
    };
    
    init();
  }, [subscriptionService]);

  const handleUpgradeClick = (tier) => {
    setSelectedTier(tier);
    setShowUpgradeModal(true);
  };

  const handleUpgradeConfirm = async () => {
    // This would call your subscription service's upgrade method
    setShowUpgradeModal(false);
    // Show success message or redirect to payment processor
    alert(`You would now be redirected to payment for ${selectedTier} tier`);
  };

  if (!initialized) {
    return <div className="p-8 text-center">Loading subscription details...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-6xl mx-auto">
      {/* Current Subscription Status */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Your Subscription</h2>
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">
              Current Plan: <span className="font-bold">{SubscriptionService.TIERS[subscriptionDetails.tier].name}</span>
            </p>
            {subscriptionDetails.tier === 'FREE' && (
              <p className="text-gray-600 mt-1">
                <span className="font-medium">{remainingScans} of {SubscriptionService.TIERS.FREE.scanLimit}</span> scans remaining this month
              </p>
            )}
            {subscriptionDetails.tier !== 'FREE' && (
              <p className="text-gray-600 mt-1">
                Next billing date: {new Date(subscriptionDetails.renewalDate).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0">
            {subscriptionDetails.tier === 'FREE' && (
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                Free Tier
              </div>
            )}
            {subscriptionDetails.tier === 'BARTENDER' && (
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                Bartender Subscriber
              </div>
            )}
            {subscriptionDetails.tier === 'RESTAURANT' && (
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
                Restaurant Subscriber
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Your Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Scans This Month</p>
            <p className="text-2xl font-bold text-gray-900">{subscriptionDetails.scanCount}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Scans Remaining</p>
            <p className="text-2xl font-bold text-gray-900">
              {remainingScans === -1 ? 'Unlimited' : remainingScans}
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Printer Connections</p>
            <p className="text-2xl font-bold text-gray-900">
              0/{SubscriptionService.TIERS[subscriptionDetails.tier].printerLimit}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Tiers */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className={`rounded-lg border ${subscriptionDetails.tier === 'FREE' ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'} overflow-hidden`}>
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Free</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">$0<span className="text-gray-500 text-sm font-normal">/month</span></p>
              
              <ul className="mb-6 space-y-2">
                {SubscriptionService.TIERS.FREE.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">{SubscriptionService.TIERS.FREE.scanLimit} scans per month</span>
                </li>
              </ul>
              
              <button
                disabled={subscriptionDetails.tier === 'FREE'}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  subscriptionDetails.tier === 'FREE' 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {subscriptionDetails.tier === 'FREE' ? 'Current Plan' : 'Downgrade'}
              </button>
            </div>
          </div>
          
          {/* Bartender Tier */}
          <div className={`rounded-lg border ${subscriptionDetails.tier === 'BARTENDER' ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'} overflow-hidden`}>
            <div className="p-5">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-bold text-gray-900">Bartender</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Popular</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-4">${SubscriptionService.TIERS.BARTENDER.price}<span className="text-gray-500 text-sm font-normal">/month</span></p>
              
              <ul className="mb-6 space-y-2">
                {SubscriptionService.TIERS.BARTENDER.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleUpgradeClick('BARTENDER')}
                disabled={subscriptionDetails.tier === 'BARTENDER'}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  subscriptionDetails.tier === 'BARTENDER' 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {subscriptionDetails.tier === 'BARTENDER' 
                  ? 'Current Plan' 
                  : subscriptionDetails.tier === 'RESTAURANT' 
                    ? 'Downgrade' 
                    : 'Upgrade'}
              </button>
            </div>
          </div>
          
          {/* Restaurant Tier */}
          <div className={`rounded-lg border ${subscriptionDetails.tier === 'RESTAURANT' ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200'} overflow-hidden`}>
            <div className="p-5">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-bold text-gray-900">Restaurant</h3>
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Best Value</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-4">${SubscriptionService.TIERS.RESTAURANT.price}<span className="text-gray-500 text-sm font-normal">/month</span></p>
              
              <ul className="mb-6 space-y-2">
                {SubscriptionService.TIERS.RESTAURANT.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleUpgradeClick('RESTAURANT')}
                disabled={subscriptionDetails.tier === 'RESTAURANT'}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  subscriptionDetails.tier === 'RESTAURANT' 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {subscriptionDetails.tier === 'RESTAURANT' ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Need More Scans Banner (Only for Free Tier) */}
      {subscriptionDetails.tier === 'FREE' && remainingScans < 5 && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <AlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
            <div>
              <h4 className="font-medium text-yellow-800">Running low on scans</h4>
              <p className="text-yellow-700 text-sm">You have {remainingScans} scans remaining this month.</p>
            </div>
          </div>
          <button 
            onClick={() => handleUpgradeClick('BARTENDER')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-6 rounded-md font-medium"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              Upgrade to {selectedTier === 'BARTENDER' ? 'Bartender' : 'Restaurant'} Plan
            </h3>
            <p className="text-gray-600 mb-4">
              You're about to upgrade to our {selectedTier === 'BARTENDER' ? 'Bartender' : 'Restaurant'} plan for ${SubscriptionService.TIERS[selectedTier].price}/month.
            </p>
            
            <div className="bg-blue-50 p-3 rounded-md text-blue-800 text-sm mb-4">
              <Zap className="inline-block w-5 h-5 mr-1 text-blue-500" />
              {selectedTier === 'BARTENDER' ? 
                'Get unlimited scans and access to all our bartender features!' : 
                'Get unlimited scans, a scanner, and Google Drive integration!'}
            </div>
            
            {selectedTier === 'RESTAURANT' && (
              <div className="bg-green-50 p-3 rounded-md text-green-800 text-sm mb-4">
                <Check className="inline-block w-5 h-5 mr-1 text-green-500" />
                Scanner will be shipped to you after your first payment is processed.
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeConfirm}
                className={`px-4 py-2 ${selectedTier === 'BARTENDER' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded-md`}
              >
                <CreditCard className="w-4 h-4 inline-block mr-1" />
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionComponent;
