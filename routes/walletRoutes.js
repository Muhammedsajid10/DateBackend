const express = require('express');
const { 
    getWomenWallet,
    convertHeartsToMoney,
    requestWithdrawal,
    getWithdrawalHistory,
    getMenCoinBalance,
    getCoinPackages,
    purchaseCoins,
    startCallSession,
    endCallSession
} = require('../controllers/walletController');
const { BadgeController, GiftController } = require('../controllers/badgeGiftController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

console.log("Wallet Routes Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// ======================
// WOMEN'S WALLET ROUTES
// ======================

// Get wallet dashboard (women only)
router.get('/women/dashboard', getWomenWallet);

// Convert hearts to real money (women only)
router.post('/women/convert-hearts', convertHeartsToMoney);

// Request money withdrawal (women only)
router.post('/women/withdraw', requestWithdrawal);

// Get withdrawal history (women only)
router.get('/women/withdrawals', getWithdrawalHistory);

// ======================
// MEN'S COIN ROUTES
// ======================

// Get coin balance (men only)
router.get('/men/balance', getMenCoinBalance);

// Get available coin packages
router.get('/men/packages', getCoinPackages);

// Purchase coins (men only)
router.post('/men/purchase', purchaseCoins);

// ======================
// CALL TRACKING ROUTES
// ======================

// Start call session (for earnings tracking)
router.post('/call/start', startCallSession);

// End call session (calculate earnings)
router.post('/call/end', endCallSession);

// ======================
// BADGE ROUTES
// ======================

// Get all available badges
router.get('/badges/available', BadgeController.getAvailableBadges);

// Get user's earned badges
router.get('/badges/earned', BadgeController.getUserBadges);

// ======================
// GIFT ROUTES
// ======================

// Get available gifts
router.get('/gifts/available', GiftController.getAvailableGifts);

// Send gift to a woman
router.post('/gifts/send', GiftController.sendGift);

// Get received gifts (women only)
router.get('/gifts/received', GiftController.getReceivedGifts);

module.exports = router;