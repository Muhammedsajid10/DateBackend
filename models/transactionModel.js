const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'deduction', 'reward', 'withdrawal', 'refund'],
    required: true
  },
  purpose: {
    type: String,
    enum: [
      'coin_purchase', 
      'message_send', 
      'voice_call', 
      'video_call', 
      'super_like', 
      'profile_boost',
      'daily_bonus',
      'engagement_reward',
      'withdrawal_to_bank',
      'referral_bonus'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  // For purchases
  paymentDetails: {
    paymentId: String,
    paymentMethod: String, // 'razorpay', 'stripe', 'upi', etc.
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
  },
  // For withdrawals
  withdrawalDetails: {
    bankAccount: String,
    upiId: String,
    withdrawalStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    transactionId: String
  },
  // For call/message deductions
  activityDetails: {
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    duration: Number, // in seconds for calls
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  description: String,
  isSuccessful: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, purpose: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);