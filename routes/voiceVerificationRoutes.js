const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
    getVerificationPhrase,
    uploadVoiceVerification,
    checkVerificationStatus,
    getVerificationRequirements,
    retryVerification
} = require('../controllers/voiceVerificationController');

// All routes require authentication
router.use(verifyToken);

// Get verification requirements and status
router.get('/requirements', getVerificationRequirements);

// Get random verification phrase
router.get('/phrase', getVerificationPhrase);

// Upload voice for verification
router.post('/upload', uploadVoiceVerification);

// Check verification status
router.get('/status/:verificationId', checkVerificationStatus);

// Retry verification
router.post('/retry', retryVerification);

module.exports = router;