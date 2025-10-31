const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  gameType: {
    type: String,
    enum: ['tic-tac-toe', 'rock-paper-scissors', 'word-game', 'quiz'],
    required: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    socketId: String,
    isReady: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    }
  }],
  gameState: {
    type: mongoose.Schema.Types.Mixed, // Flexible structure for different game types
    default: {}
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'abandoned'],
    default: 'waiting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  coinReward: {
    type: Number,
    default: 0
  },
  startedAt: Date,
  completedAt: Date,
  roomId: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
gameSessionSchema.index({ status: 1, gameType: 1 });
gameSessionSchema.index({ 'players.userId': 1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);