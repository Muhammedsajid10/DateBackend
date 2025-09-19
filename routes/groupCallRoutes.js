const express = require('express');
const router = express.Router();
const groupCallController = require('../controllers/groupCallController');
const { verifyToken } = require('../middleware/auth');

// All group call routes require authentication
router.use(verifyToken);

// Create new group call
router.post('/create', groupCallController.createGroupCall);

// Join group call
router.post('/join/:roomId', groupCallController.joinGroupCall);

// Leave group call
router.post('/leave/:roomId', groupCallController.leaveGroupCall);

// Get active group calls
router.get('/active', groupCallController.getActiveGroupCalls);

// Get user's group call history
router.get('/my-calls', groupCallController.getUserGroupCalls);

// Update participant settings (mute/video)
router.put('/settings/:roomId', groupCallController.updateParticipantSettings);

// End group call (creator only)
router.post('/end/:roomId', groupCallController.endGroupCall);

module.exports = router;