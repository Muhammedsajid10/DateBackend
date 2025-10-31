const express = require('express');
const { sendOTP, verifyOTP, GetUsers } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/users', verifyToken, GetUsers);

module.exports = router;