const mongoose = require('mongoose');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const joi = require('joi');

// Coin packages
const COIN_PACKAGES = {
  basic: { coins: 100, price: 99, currency: 'INR' },      // ₹99 for 100 coins
  standard: { coins: 500, price: 399, currency: 'INR' },  // ₹399 for 500 coins
  premium: { coins: 1000, price: 699, currency: 'INR' },  // ₹699 for 1000 coins
  mega: { coins: 2500, price: 1499, currency: 'INR' }     // ₹1499 for 2500 coins
};

// Get available coin packages
exports.getCoinPackages = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: COIN_PACKAGES,
      message: 'Coin packages retrieved successfully'
    });
  } catch (error) {
    console.error('Get coin packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create payment order (Razorpay/Test mode)
exports.createPaymentOrder = async (req, res) => {
  try {
    const schema = joi.object({
      packageType: joi.string().valid('basic', 'standard', 'premium', 'mega').required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { packageType } = req.body;
    const package = COIN_PACKAGES[packageType];
    const currentUser = req.user;

    // Create transaction record
    const transaction = await Transaction.create({
      userId: currentUser._id,
      type: 'purchase',
      purpose: 'coin_purchase',
      amount: package.coins,
      balanceBefore: currentUser.coins,
      balanceAfter: currentUser.coins + package.coins,
      paymentDetails: {
        paymentMethod: 'test_mode',
        paymentStatus: 'pending'
      },
      description: `Purchase of ${package.coins} coins for ₹${package.price}`,
      isSuccessful: false
    });

    // In production, integrate with Razorpay
    // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    // const order = await razorpay.orders.create({
    //   amount: package.price * 100, // Amount in paise
    //   currency: package.currency,
    //   receipt: transaction._id.toString()
    // });

    // For now, return test order
    const testOrder = {
      id: `order_test_${Date.now()}`,
      amount: package.price * 100,
      currency: package.currency,
      receipt: transaction._id.toString()
    };

    res.status(200).json({
      success: true,
      data: {
        order: testOrder,
        package: package,
        transactionId: transaction._id
      },
      message: 'Payment order created successfully'
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify payment and add coins
exports.verifyPayment = async (req, res) => {
  try {
    const schema = joi.object({
      transactionId: joi.string().required(),
      paymentId: joi.string().required(),
      signature: joi.string().required(),
      orderId: joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { transactionId, paymentId, signature, orderId } = req.body;
    const currentUser = req.user;
    
    // Check if transactionId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID format. Please provide a valid transaction ID.'
      });
    }

    // Find transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // In production, verify signature with Razorpay
    // const crypto = require('crypto');
    // const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(orderId + "|" + paymentId)
    //   .digest('hex');
    // 
    // if (expectedSignature !== signature) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Payment verification failed'
    //   });
    // }

    // For test mode, assume payment is successful
    const isPaymentValid = true; // In production, replace with actual verification

    if (isPaymentValid) {
      // Update user coins
      await User.findByIdAndUpdate(currentUser._id, {
        $inc: { coins: transaction.amount }
      });

      // Update transaction
      transaction.paymentDetails.paymentId = paymentId;
      transaction.paymentDetails.razorpayOrderId = orderId;
      transaction.paymentDetails.razorpaySignature = signature;
      transaction.paymentDetails.paymentStatus = 'completed';
      transaction.isSuccessful = true;
      await transaction.save();

      res.status(200).json({
        success: true,
        data: {
          coinsAdded: transaction.amount,
          newBalance: currentUser.coins + transaction.amount
        },
        message: 'Payment verified and coins added successfully'
      });
    } else {
      transaction.paymentDetails.paymentStatus = 'failed';
      await transaction.save();

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Deduct coins for activities
exports.deductCoins = async (req, res) => {
  try {
    const schema = joi.object({
      purpose: joi.string().valid('message_send', 'voice_call', 'video_call', 'profile_boost').required(),
      amount: joi.number().positive().required(),
      targetUserId: joi.string(), // For messages/calls
      duration: joi.number() // For calls (in seconds)
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { purpose, amount, targetUserId, duration } = req.body;
    const currentUser = req.user;
    
    // Check if targetUserId is provided and is a valid ObjectId
    if (targetUserId && !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target user ID format. Please provide a valid user ID.'
      });
    }

    // Check if user has enough coins
    if (currentUser.coins < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins'
      });
    }

    // Deduct coins
    await User.findByIdAndUpdate(currentUser._id, {
      $inc: { coins: -amount }
    });

    // Create transaction record
    const transactionData = {
      userId: currentUser._id,
      type: 'deduction',
      purpose,
      amount,
      balanceBefore: currentUser.coins,
      balanceAfter: currentUser.coins - amount,
      description: `Coins deducted for ${purpose}`
    };

    if (targetUserId) {
      transactionData.activityDetails = { targetUserId };
      if (duration) {
        transactionData.activityDetails.duration = duration;
      }
    }

    await Transaction.create(transactionData);

    res.status(200).json({
      success: true,
      data: {
        coinsDeducted: amount,
        newBalance: currentUser.coins - amount
      },
      message: 'Coins deducted successfully'
    });

  } catch (error) {
    console.error('Deduct coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reward coins (for girls)
exports.rewardCoins = async (req, res) => {
  try {
    const schema = joi.object({
      purpose: joi.string().valid('daily_bonus', 'engagement_reward', 'referral_bonus').required(),
      amount: joi.number().positive().required(),
      description: joi.string()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { purpose, amount, description } = req.body;
    const currentUser = req.user;

    // Add coins
    await User.findByIdAndUpdate(currentUser._id, {
      $inc: { coins: amount }
    });

    // Create transaction record
    await Transaction.create({
      userId: currentUser._id,
      type: 'reward',
      purpose,
      amount,
      balanceBefore: currentUser.coins,
      balanceAfter: currentUser.coins + amount,
      description: description || `Reward coins for ${purpose}`
    });

    res.status(200).json({
      success: true,
      data: {
        coinsRewarded: amount,
        newBalance: currentUser.coins + amount
      },
      message: 'Coins rewarded successfully'
    });

  } catch (error) {
    console.error('Reward coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type; // 'purchase', 'deduction', 'reward'

    let filter = { userId: req.user._id };
    if (type) {
      filter.type = type;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('activityDetails.targetUserId', 'username')
      .select('-paymentDetails.razorpaySignature'); // Hide sensitive data

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'Transaction history retrieved successfully'
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current coin balance
exports.getCoinBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('coins');
    
    res.status(200).json({
      success: true,
      data: {
        coins: user.coins
      },
      message: 'Coin balance retrieved successfully'
    });

  } catch (error) {
    console.error('Get coin balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCoinPackages: exports.getCoinPackages,
  createPaymentOrder: exports.createPaymentOrder,
  verifyPayment: exports.verifyPayment,
  deductCoins: exports.deductCoins,
  rewardCoins: exports.rewardCoins,
  getTransactionHistory: exports.getTransactionHistory,
  getCoinBalance: exports.getCoinBalance
};