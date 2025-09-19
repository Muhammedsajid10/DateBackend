const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// All payment routes require authentication
router.use(verifyToken);

// Get available coin packages
router.get('/packages', paymentController.getCoinPackages);

// Create payment order
router.post('/create-order', paymentController.createPaymentOrder);

// Verify payment
router.post('/verify', paymentController.verifyPayment);

// Deduct coins for activities
router.post('/deduct', paymentController.deductCoins);

// Reward coins (for engagement)
router.post('/reward', paymentController.rewardCoins);

// Get transaction history
router.get('/transactions', paymentController.getTransactionHistory);

// Get current coin balance
router.get('/balance', paymentController.getCoinBalance);

module.exports = router;