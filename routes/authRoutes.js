const express = require('express');
const { sendOTP, verifyOTP, GetUsers } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.get('/users', verifyToken, GetUsers);

module.exports = router;