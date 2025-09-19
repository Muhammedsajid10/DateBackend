const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { verifyToken } = require('../middleware/auth');

// All match routes require authentication
router.use(verifyToken);

// Swipe on a user (like/dislike/superlike)
router.post('/swipe', matchController.swipeUser);

// Get potential matches
router.get('/potential', matchController.getPotentialMatches);

// Get user's matches
router.get('/', matchController.getMatches);

// Unmatch a user
router.delete('/:matchId', matchController.unmatchUser);

module.exports = router;