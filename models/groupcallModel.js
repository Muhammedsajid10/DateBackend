const mongoose = require('mongoose');

const groupCallSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    socketId: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    isVideoOff: {
      type: Boolean,
      default: false
    }
  }],
  maxParticipants: {
    type: Number,
    default: 8,
    max: 20
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  },
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  coinCost: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

groupCallSchema.index({ roomId: 1 });
groupCallSchema.index({ creator: 1, status: 1 });
groupCallSchema.index({ 'participants.userId': 1 });

module.exports = mongoose.model('GroupCall', groupCallSchema);
