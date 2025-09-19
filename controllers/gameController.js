const GameSession = require('../models/gameSessionModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const joi = require('joi');

// Create a new game session
exports.createGameSession = async (req, res) => {
  try {
    const schema = joi.object({
      gameType: joi.string().valid('tic-tac-toe', 'rock-paper-scissors', 'word-game', 'quiz').required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { gameType } = req.body;
    const currentUser = req.user;

    // Generate unique room ID
    const roomId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create game session
    const gameSession = new GameSession({
      gameType,
      players: [{
        userId: currentUser._id,
        username: currentUser.username,
        isReady: true
      }],
      roomId,
      status: 'waiting'
    });

    await gameSession.save();

    res.status(201).json({
      success: true,
      data: gameSession,
      message: 'Game session created successfully'
    });

  } catch (error) {
    console.error('Create game session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Join an existing game session
exports.joinGameSession = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUser = req.user;

    const gameSession = await GameSession.findOne({ roomId, status: 'waiting' });

    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: 'Game session not found or already started'
      });
    }

    // Check if user is already in the game
    const existingPlayer = gameSession.players.find(player => 
      player.userId.toString() === currentUser._id.toString()
    );

    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'You are already in this game'
      });
    }

    // Check if game is full (most games are 2 players)
    if (gameSession.players.length >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Game session is full'
      });
    }

    // Add player to game
    gameSession.players.push({
      userId: currentUser._id,
      username: currentUser.username,
      isReady: false
    });

    await gameSession.save();

    res.status(200).json({
      success: true,
      data: gameSession,
      message: 'Joined game session successfully'
    });

  } catch (error) {
    console.error('Join game session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get available game sessions
exports.getAvailableGames = async (req, res) => {
  try {
    const { gameType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { 
      status: 'waiting',
      'players.1': { $exists: false } // Games with less than 2 players
    };

    if (gameType) {
      filter.gameType = gameType;
    }

    const games = await GameSession.find(filter)
      .populate('players.userId', 'username profilePictures')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GameSession.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'Available games retrieved successfully'
    });

  } catch (error) {
    console.error('Get available games error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's game sessions
exports.getUserGameSessions = async (req, res) => {
  try {
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const games = await GameSession.find({
      'players.userId': currentUser._id
    })
    .populate('players.userId', 'username profilePictures')
    .populate('winner', 'username')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await GameSession.countDocuments({
      'players.userId': currentUser._id
    });

    res.status(200).json({
      success: true,
      data: games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'User game sessions retrieved successfully'
    });

  } catch (error) {
    console.error('Get user game sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update player ready status
exports.updatePlayerReady = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { isReady } = req.body;
    const currentUser = req.user;

    const gameSession = await GameSession.findOne({ roomId });

    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: 'Game session not found'
      });
    }

    const player = gameSession.players.find(p => 
      p.userId.toString() === currentUser._id.toString()
    );

    if (!player) {
      return res.status(400).json({
        success: false,
        message: 'You are not in this game'
      });
    }

    player.isReady = !!isReady;

    // Check if all players are ready
    const allReady = gameSession.players.every(p => p.isReady);
    if (allReady && gameSession.players.length >= 2) {
      gameSession.status = 'in-progress';
      gameSession.startedAt = new Date();
    }

    await gameSession.save();

    res.status(200).json({
      success: true,
      data: gameSession,
      message: 'Player ready status updated'
    });

  } catch (error) {
    console.error('Update player ready error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// End game and declare winner
exports.endGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { winnerId, gameResult } = req.body;

    const gameSession = await GameSession.findOne({ roomId });

    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: 'Game session not found'
      });
    }

    if (gameSession.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Game is not in progress'
      });
    }

    gameSession.status = 'completed';
    gameSession.completedAt = new Date();
    gameSession.gameState = gameResult || {};

    if (winnerId) {
      gameSession.winner = winnerId;
      gameSession.coinReward = 10; // Standard reward

      // Add coins to winner
      await User.findByIdAndUpdate(winnerId, { $inc: { coins: 10 } });

      // Create transaction for winner
      const winner = await User.findById(winnerId);
      await Transaction.create({
        userId: winnerId,
        type: 'reward',
        purpose: 'engagement_reward',
        amount: 10,
        balanceBefore: winner.coins,
        balanceAfter: winner.coins + 10,
        description: `Game victory reward - ${gameSession.gameType}`
      });
    }

    await gameSession.save();

    res.status(200).json({
      success: true,
      data: gameSession,
      message: 'Game ended successfully'
    });

  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Leave game session
exports.leaveGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUser = req.user;

    const gameSession = await GameSession.findOne({ roomId });

    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: 'Game session not found'
      });
    }

    // Remove player from game
    gameSession.players = gameSession.players.filter(p => 
      p.userId.toString() !== currentUser._id.toString()
    );

    // If no players left, mark as abandoned
    if (gameSession.players.length === 0) {
      gameSession.status = 'abandoned';
    }

    await gameSession.save();

    res.status(200).json({
      success: true,
      message: 'Left game successfully'
    });

  } catch (error) {
    console.error('Leave game error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createGameSession: exports.createGameSession,
  joinGameSession: exports.joinGameSession,
  getAvailableGames: exports.getAvailableGames,
  getUserGameSessions: exports.getUserGameSessions,
  updatePlayerReady: exports.updatePlayerReady,
  endGame: exports.endGame,
  leaveGame: exports.leaveGame
};