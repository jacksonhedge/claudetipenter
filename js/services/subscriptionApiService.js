/**
 * Subscription API Service
 * Backend API routes for handling subscription-related requests
 */

const express = require('express');
const router = express.Router();
const { verifyAuth, verifyAdmin } = require('../middleware/auth');
const { 
  User, 
  Subscription, 
  SubscriptionLimit, 
  ScanUsage, 
  TeamMember, 
  PaymentHistory 
} = require('../models/index');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Subscription tier limits and pricing
const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    scanLimit: 15,
    printerLimit: 1,
    features: ['basic_analytics', 'manual_export'],
    stripeProductId: null,
    price: 0
  },
  BARTENDER: {
    name: 'Bartender',
    scanLimit: -1, // Unlimited
    printerLimit: 2,
    features: ['basic_analytics', 'advanced_analytics', 'auto_export', 'cloud_storage'],
    stripeProductId: 'prod_bartender',
    price: 4.99
  },
  RESTAURANT: {
    name: 'Restaurant',
    scanLimit: -1, // Unlimited
    printerLimit: 5,
    features: ['basic_analytics', 'advanced_analytics', 'auto_export', 'priority_support', 'team_analytics', 'multi_user', 'scanner_included', 'google_drive_integration'],
    stripeProductId: 'prod_restaurant',
    price: 89.99,
    userLimit: 5,
    includesScanner: true
  }
};

/**
 * GET /api/subscription
 * Get current user's subscription status
 */
router.get('/subscription', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user and subscription details
    const user = await User.findById(userId).select('name email scan_count');
    const subscription = await Subscription.findOne({ user: userId }).select('tier status renewal_date');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Return user and subscription (or default to FREE tier if no subscription found)
    res.json({
      success: true,
      user,
      subscription: subscription || {
        tier: 'FREE',
        status: 'active',
        renewal_date: null
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription details'
    });
  }
});

/**
 * POST /api/subscription/upgrade
 * Upgrade to a paid subscription
 */
router.post('/subscription/upgrade', verifyAuth, async (req, res) => {
  try {
    const { tier } = req.body;
    const userId = req.user.id;
    
    // Validate tier
    if (!tier || !SUBSCRIPTION_TIERS[tier]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription tier'
      });
    }
    
    // Free tier doesn't require payment
    if (tier === 'FREE') {
      const subscription = await Subscription.findOneAndUpdate(
        { user: userId },
        { 
          tier: 'FREE',
          status: 'active',
          renewal_date: null,
          stripe_subscription_id: null
        },
        { new: true, upsert: true }
      );
      
      return res.json({
        success: true,
        message: 'Downgraded to free tier successfully',
        subscription
      });
    }
    
    // For paid tiers, create a Stripe Checkout session
    const tierDetails = SUBSCRIPTION_TIERS[tier];
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product: tierDetails.stripeProductId,
            unit_amount: Math.round(tierDetails.price * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      client_reference_id: userId,
      metadata: {
        tier
      }
    });
    
    res.json({
      success: true,
      session_id: session.id,
      checkout_url: session.url
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade subscription'
    });
  }
});

/**
 * POST /api/subscription/webhook
 * Stripe webhook for subscription events
 */
router.post('/subscription/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // Extract customer and subscription info
      const userId = session.client_reference_id;
      const tier = session.metadata.tier;
      const stripeSubscriptionId = session.subscription;
      
      // Create or update subscription
      await Subscription.findOneAndUpdate(
        { user: userId },
        {
          tier,
          status: 'active',
          stripe_subscription_id: stripeSubscriptionId,
          renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Approximately a month from now
        },
        { new: true, upsert: true }
      );
      
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const stripeSubscriptionId = invoice.subscription;
      
      // Update subscription renewal date
      const subscription = await Subscription.findOne({ stripe_subscription_id: stripeSubscriptionId });
      
      if (subscription) {
        subscription.status = 'active';
        subscription.renewal_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await subscription.save();
      }
      
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const stripeSubscriptionId = invoice.subscription;
      
      // Update subscription status
      const subscription = await Subscription.findOne({ stripe_subscription_id: stripeSubscriptionId });
      
      if (subscription) {
        subscription.status = 'past_due';
        await subscription.save();
      }
      
      break;
    }
    
    case 'customer.subscription.deleted': {
      const stripeSubscription = event.data.object;
      const stripeSubscriptionId = stripeSubscription.id;
      
      // Downgrade to free tier
      const subscription = await Subscription.findOne({ stripe_subscription_id: stripeSubscriptionId });
      
      if (subscription) {
        subscription.tier = 'FREE';
        subscription.status = 'inactive';
        subscription.stripe_subscription_id = null;
        subscription.renewal_date = null;
        await subscription.save();
      }
      
      break;
    }
  }

  res.status(200).send({ received: true });
});

/**
 * POST /api/usage/scan
 * Record scan usage
 */
router.post('/usage/scan', verifyAuth, async (req, res) => {
  try {
    const { count = 1 } = req.body;
    const userId = req.user.id;
    
    // Validate count
    if (isNaN(count) || count < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scan count'
      });
    }
    
    // Get user subscription
    const user = await User.findById(userId);
    const subscription = await Subscription.findOne({ user: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Set current tier to FREE if no subscription found
    const currentTier = subscription ? subscription.tier : 'FREE';
    const tierDetails = SUBSCRIPTION_TIERS[currentTier];
    
    // Check if user has available scans (if not unlimited)
    if (tierDetails.scanLimit !== -1 && user.scan_count + count > tierDetails.scanLimit) {
      return res.status(400).json({
        success: false,
        error: 'Scan limit exceeded',
        scan_count: user.scan_count,
        scan_limit: tierDetails.scanLimit
      });
    }
    
    // Record scan usage
    const scanUsage = new ScanUsage({
      user: userId,
      count,
      date: new Date()
    });
    await scanUsage.save();
    
    // Update user scan count
    user.scan_count += count;
    await user.save();
    
    res.json({
      success: true,
      new_scan_count: user.scan_count,
      scan_limit: tierDetails.scanLimit
    });
  } catch (error) {
    console.error('Error recording scan usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record scan usage'
    });
  }
});

/**
 * POST /api/admin/add-scans
 * Add complimentary scans to a user (admin only)
 */
router.post('/admin/add-scans', verifyAdmin, async (req, res) => {
  try {
    const { userId, scanCount } = req.body;
    
    // Validate input
    if (!userId || isNaN(scanCount) || scanCount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID or scan count'
      });
    }
    
    // Get user and subscription
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get their current subscription details
    const subscription = await Subscription.findOne({ user: userId });
    const currentTier = subscription ? subscription.tier : 'FREE';
    
    // If user is on free tier, create or update their subscription limit
    let scanLimit = SUBSCRIPTION_TIERS[currentTier].scanLimit;
    
    if (currentTier === 'FREE') {
      // Check for existing subscription limit override
      let subscriptionLimit = await SubscriptionLimit.findOne({ user: userId });
      
      if (subscriptionLimit) {
        // Update existing limit
        subscriptionLimit.scan_limit += scanCount;
        await subscriptionLimit.save();
        scanLimit = subscriptionLimit.scan_limit;
      } else {
        // Create new limit override
        subscriptionLimit = new SubscriptionLimit({
          user: userId,
          scan_limit: SUBSCRIPTION_TIERS.FREE.scanLimit + scanCount
        });
        await subscriptionLimit.save();
        scanLimit = subscriptionLimit.scan_limit;
      }
    }
    
    // Record the complimentary scans
    const scanUsage = new ScanUsage({
      user: userId,
      count: 0, // Zero count because we're not using scans, just adding to the limit
      complimentary: scanCount,
      date: new Date(),
      added_by: req.user.id // Admin who added the scans
    });
    await scanUsage.save();
    
    res.json({
      success: true,
      message: `Added ${scanCount} complimentary scans to ${user.name}`,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        new_scan_count: user.scan_count,
        new_scan_limit: scanLimit
      }
    });
  } catch (error) {
    console.error('Error adding complimentary scans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add complimentary scans'
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with their subscription details (admin only)
 */
router.get('/admin/users', verifyAdmin, async (req, res) => {
  try {
    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get filter params
    const searchTerm = req.query.search || '';
    const tierFilter = req.query.tier || '';
    
    // Build query
    let query = {};
    
    // Apply search filter
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Count total users matching query
    const total = await User.countDocuments(query);
    
    // Get users
    const users = await User.find(query)
      .select('name email scan_count created_at last_login')
      .skip(skip)
      .limit(limit)
      .sort({ last_login: -1 });
    
    // Get subscription info for each user
    const usersWithSubscription = await Promise.all(users.map(async (user) => {
      const subscription = await Subscription.findOne({ user: user._id });
      const subscriptionLimit = await SubscriptionLimit.findOne({ user: user._id });
      
      const tier = subscription ? subscription.tier : 'FREE';
      let scanLimit = SUBSCRIPTION_TIERS[tier].scanLimit;
      
      // If there's a custom limit for free tier
      if (tier === 'FREE' && subscriptionLimit) {
        scanLimit = subscriptionLimit.scan_limit;
      }
      
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription_tier: tier,
        scan_count: user.scan_count,
        scan_limit: scanLimit,
        created_at: user.created_at,
        last_login: user.last_login
      };
    }));
    
    // Apply subscription tier filter after fetching data
    const filteredUsers = tierFilter 
      ? usersWithSubscription.filter(user => user.subscription_tier.toLowerCase() === tierFilter.toLowerCase())
      : usersWithSubscription;
    
    // Calculate pagination details
    const totalFiltered = filteredUsers.length;
    const pages = Math.ceil(totalFiltered / limit);
    
    res.json({
      success: true,
      users: filteredUsers,
      pagination: {
        total,
        filtered: totalFiltered,
        page,
        pages,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/admin/subscription-stats
 * Get subscription statistics (admin only)
 */
router.get('/admin/subscription-stats', verifyAdmin, async (req, res) => {
  try {
    // Get total user count
    const totalUsers = await User.countDocuments();
    
    // Get subscription distribution
    const subscriptions = await Subscription.find();
    
    // Count users by tier
    const freeCount = totalUsers - subscriptions.length;
    const bartenderCount = subscriptions.filter(sub => sub.tier === 'BARTENDER').length;
    const restaurantCount = subscriptions.filter(sub => sub.tier === 'RESTAURANT').length;
    
    // Calculate monthly recurring revenue
    const mrr = (bartenderCount * SUBSCRIPTION_TIERS.BARTENDER.price) + 
                (restaurantCount * SUBSCRIPTION_TIERS.RESTAURANT.price);
    
    // Get scan usage statistics
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyScans = await ScanUsage.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    
    const totalScansThisMonth = monthlyScans.length > 0 ? monthlyScans[0].total : 0;
    
    // Return statistics
    res.json({
      success: true,
      user_stats: {
        total_users: totalUsers,
        free_users: freeCount,
        bartender_users: bartenderCount,
        restaurant_users: restaurantCount
      },
      financial_stats: {
        mrr: mrr.toFixed(2),
        average_revenue_per_user: totalUsers > 0 ? (mrr / totalUsers).toFixed(2) : '0.00'
      },
      usage_stats: {
        total_scans_this_month: totalScansThisMonth,
        average_scans_per_user: totalUsers > 0 ? (totalScansThisMonth / totalUsers).toFixed(1) : '0.0'
      }
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription statistics'
    });
  }
});

module.exports = router;
