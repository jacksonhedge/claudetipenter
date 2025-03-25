/**
 * Subscription Database Models
 * MongoDB/Mongoose models for subscription management
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * User Model
 * Base user account information
 */
const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  scan_count: {
    type: Number,
    default: 0
  },
  stripe_customer_id: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date,
    default: Date.now
  }
});

/**
 * Subscription Model
 * Tracks user subscription status
 */
const SubscriptionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tier: {
    type: String,
    enum: ['FREE', 'BARTENDER', 'RESTAURANT'],
    default: 'FREE'
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'inactive'],
    default: 'active'
  },
  stripe_subscription_id: {
    type: String,
    default: null
  },
  renewal_date: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before save
SubscriptionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

/**
 * Subscription Limit Model
 * For overriding default scan limits for free tier users
 */
const SubscriptionLimitSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scan_limit: {
    type: Number,
    required: true
  },
  expires_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before save
SubscriptionLimitSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

/**
 * Scan Usage Model
 * Tracks individual scan usage events
 */
const ScanUsageSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  count: {
    type: Number,
    required: true,
    min: 0
  },
  complimentary: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  added_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

/**
 * Team Member Model
 * For tracking members in team subscriptions
 */
const TeamMemberSchema = new Schema({
  team_owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  member: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

/**
 * Payment History Model
 * Tracks payment history for subscriptions
 */
const PaymentHistorySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripe_payment_id: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['succeeded', 'failed', 'pending', 'refunded'],
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Create models
const User = mongoose.model('User', UserSchema);
const Subscription = mongoose.model('Subscription', SubscriptionSchema);
const SubscriptionLimit = mongoose.model('SubscriptionLimit', SubscriptionLimitSchema);
const ScanUsage = mongoose.model('ScanUsage', ScanUsageSchema);
const TeamMember = mongoose.model('TeamMember', TeamMemberSchema);
const PaymentHistory = mongoose.model('PaymentHistory', PaymentHistorySchema);

// Export models
module.exports = {
  User,
  Subscription,
  SubscriptionLimit,
  ScanUsage,
  TeamMember,
  PaymentHistory
};
