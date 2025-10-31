const express = require('express');
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// All profile routes require authentication
router.use(verifyToken);

// Get current user profile
router.get('/', profileController.getProfile);

// Get profile completion status
router.get('/completion-status', profileController.getProfileCompletionStatus);

// Update profile
router.put('/update', profileController.updateProfile);

// Get another user's profile
router.get('/user/:userId', profileController.getUserProfile);

// Upload profile pictures
router.post('/upload-photos', profileController.uploadProfilePictures);

// Delete profile picture
router.delete('/photo', profileController.deleteProfilePicture);

// Search and filter users
router.get('/search', profileController.searchUsers);

// Get random online users
router.get('/random-online', profileController.getRandomOnlineUsers);

// Update online status
router.put('/online-status', profileController.updateOnlineStatus);

module.exports = router;