const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user1Action: {
    type: String,
    enum: ['like', 'dislike', 'superlike', 'pending'],
    default: 'pending'
  },
  user2Action: {
    type: String,
    enum: ['like', 'dislike', 'superlike', 'pending'],
    default: 'pending'
  },
  isMatch: {
    type: Boolean,
    default: false
  },
  matchedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique combination of users
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Method to check if it's a match
matchSchema.methods.checkMatch = function() {
  if (this.user1Action === 'like' && this.user2Action === 'like') {
    this.isMatch = true;
    this.matchedAt = new Date();
  }
  return this.isMatch;
};

module.exports = mongoose.model('Match', matchSchema);