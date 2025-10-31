const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { verifyToken } = require('../middleware/auth');

// All game routes require authentication
router.use(verifyToken);

// Create new game session
router.post('/create', gameController.createGameSession);

// Join existing game session
router.post('/join/:roomId', gameController.joinGameSession);

// Get available games
router.get('/available', gameController.getAvailableGames);

// Get user's game sessions
router.get('/my-games', gameController.getUserGameSessions);

// Update player ready status
router.put('/:roomId/ready', gameController.updatePlayerReady);

// End game
router.post('/:roomId/end', gameController.endGame);

// Leave game
router.delete('/:roomId/leave', gameController.leaveGame);

module.exports = router;