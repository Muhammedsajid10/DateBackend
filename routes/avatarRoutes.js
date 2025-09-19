const express = require('express');
const { 
    getAvatars,
    getAvatarsByUserGender,
    selectAvatar,
    getUserAvatar,
    addAvatar,
    seedAvatars
} = require('../controllers/avatarController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

console.log("Avatar Routes Loaded");

// Apply authentication middleware to all routes except seeding
router.use(verifyToken);

// Get all available avatars (with optional category filter)
router.get('/all', getAvatars);

// Get avatars filtered by user's gender
router.get('/recommended', getAvatarsByUserGender);

// Select an avatar for the user
router.post('/select', selectAvatar);

// Get user's current avatar selection
router.get('/my-avatar', getUserAvatar);

// Admin routes (for seeding and management)
router.post('/admin/add', addAvatar);
router.post('/admin/seed', seedAvatars);

module.exports = router;