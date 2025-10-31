const GroupCall = require('../models/groupcallModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const joi = require('joi');

// Create a new group call
exports.createGroupCall = async (req, res) => {
  try {
    const schema = joi.object({
      callType: joi.string().valid('audio', 'video').required(),
      maxParticipants: joi.number().min(2).max(20).default(8)
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { callType, maxParticipants } = req.body;
    const currentUser = req.user;

    // Generate unique room ID
    const roomId = `group_${callType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create group call
    const groupCall = new GroupCall({
      roomId,
      callType,
      creator: currentUser._id,
      participants: [{
        userId: currentUser._id,
        isActive: true
      }],
      maxParticipants,
      status: 'waiting'
    });

    await groupCall.save();
    await groupCall.populate('creator', 'username profilePictures');

    res.status(201).json({
      success: true,
      data: groupCall,
      message: 'Group call created successfully'
    });

  } catch (error) {
    console.error('Create group call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Join a group call
exports.joinGroupCall = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUser = req.user;

    const groupCall = await GroupCall.findOne({ 
      roomId, 
      status: { $in: ['waiting', 'active'] } 
    });

    if (!groupCall) {
      return res.status(404).json({
        success: false,
        message: 'Group call not found or already ended'
      });
    }

    // Check if user is already in the call
    const existingParticipant = groupCall.participants.find(p => 
      p.userId.toString() === currentUser._id.toString() && p.isActive
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already in this call'
      });
    }

    // Check if call is full
    const activeParticipants = groupCall.participants.filter(p => p.isActive);
    if (activeParticipants.length >= groupCall.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Group call is full'
      });
    }

    // Check if user has enough coins (5 coins to join)
    if (currentUser.coins < 5) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins to join group call'
      });
    }

    // Deduct coins
    await User.findByIdAndUpdate(currentUser._id, { $inc: { coins: -5 } });

    // Create transaction
    await Transaction.create({
      userId: currentUser._id,
      type: 'deduction',
      purpose: `group_${groupCall.callType}_call`,
      amount: 5,
      balanceBefore: currentUser.coins,
      balanceAfter: currentUser.coins - 5,
      activityDetails: {
        roomId: roomId,
        callType: groupCall.callType
      }
    });

    // Add participant to call
    groupCall.participants.push({
      userId: currentUser._id,
      isActive: true
    });

    // Start call if first participant joins
    if (activeParticipants.length === 1 && groupCall.status === 'waiting') {
      groupCall.status = 'active';
      groupCall.startedAt = new Date();
    }

    await groupCall.save();
    await groupCall.populate('participants.userId', 'username profilePictures');

    res.status(200).json({
      success: true,
      data: groupCall,
      message: 'Joined group call successfully'
    });

  } catch (error) {
    console.error('Join group call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Leave group call
exports.leaveGroupCall = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUser = req.user;

    const groupCall = await GroupCall.findOne({ roomId });

    if (!groupCall) {
      return res.status(404).json({
        success: false,
        message: 'Group call not found'
      });
    }

    // Find and update participant
    const participant = groupCall.participants.find(p => 
      p.userId.toString() === currentUser._id.toString() && p.isActive
    );

    if (!participant) {
      return res.status(400).json({
        success: false,
        message: 'You are not in this call'
      });
    }

    participant.isActive = false;
    participant.leftAt = new Date();

    // Check if call should end (no active participants)
    const activeParticipants = groupCall.participants.filter(p => p.isActive);
    if (activeParticipants.length === 0) {
      groupCall.status = 'ended';
      groupCall.endedAt = new Date();
      if (groupCall.startedAt) {
        groupCall.duration = Math.floor((groupCall.endedAt - groupCall.startedAt) / 1000);
      }
    }

    await groupCall.save();

    res.status(200).json({
      success: true,
      message: 'Left group call successfully'
    });

  } catch (error) {
    console.error('Leave group call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get active group calls
exports.getActiveGroupCalls = async (req, res) => {
  try {
    const { callType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { 
      status: { $in: ['waiting', 'active'] }
    };

    if (callType) {
      filter.callType = callType;
    }

    const groupCalls = await GroupCall.find(filter)
      .populate('creator', 'username profilePictures')
      .populate('participants.userId', 'username profilePictures')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter to show only calls with available spots
    const availableCalls = groupCalls.filter(call => {
      const activeParticipants = call.participants.filter(p => p.isActive);
      return activeParticipants.length < call.maxParticipants;
    });

    const total = await GroupCall.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: availableCalls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'Active group calls retrieved successfully'
    });

  } catch (error) {
    console.error('Get active group calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's group call history
exports.getUserGroupCalls = async (req, res) => {
  try {
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const groupCalls = await GroupCall.find({
      'participants.userId': currentUser._id
    })
    .populate('creator', 'username profilePictures')
    .populate('participants.userId', 'username profilePictures')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await GroupCall.countDocuments({
      'participants.userId': currentUser._id
    });

    res.status(200).json({
      success: true,
      data: groupCalls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'User group calls retrieved successfully'
    });

  } catch (error) {
    console.error('Get user group calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update participant settings (mute/unmute, video on/off)
exports.updateParticipantSettings = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { isMuted, isVideoOff } = req.body;
    const currentUser = req.user;

    const groupCall = await GroupCall.findOne({ roomId });

    if (!groupCall) {
      return res.status(404).json({
        success: false,
        message: 'Group call not found'
      });
    }

    const participant = groupCall.participants.find(p => 
      p.userId.toString() === currentUser._id.toString() && p.isActive
    );

    if (!participant) {
      return res.status(400).json({
        success: false,
        message: 'You are not in this call'
      });
    }

    if (isMuted !== undefined) participant.isMuted = isMuted;
    if (isVideoOff !== undefined) participant.isVideoOff = isVideoOff;

    await groupCall.save();

    res.status(200).json({
      success: true,
      message: 'Participant settings updated successfully'
    });

  } catch (error) {
    console.error('Update participant settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// End group call (only creator can end)
exports.endGroupCall = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUser = req.user;

    const groupCall = await GroupCall.findOne({ roomId });

    if (!groupCall) {
      return res.status(404).json({
        success: false,
        message: 'Group call not found'
      });
    }

    // Only creator can end the call
    if (groupCall.creator.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the call creator can end the group call'
      });
    }

    groupCall.status = 'ended';
    groupCall.endedAt = new Date();
    
    if (groupCall.startedAt) {
      groupCall.duration = Math.floor((groupCall.endedAt - groupCall.startedAt) / 1000);
    }

    // Mark all participants as inactive
    groupCall.participants.forEach(participant => {
      if (participant.isActive) {
        participant.isActive = false;
        participant.leftAt = new Date();
      }
    });

    await groupCall.save();

    res.status(200).json({
      success: true,
      message: 'Group call ended successfully'
    });

  } catch (error) {
    console.error('End group call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createGroupCall: exports.createGroupCall,
  joinGroupCall: exports.joinGroupCall,
  leaveGroupCall: exports.leaveGroupCall,
  getActiveGroupCalls: exports.getActiveGroupCalls,
  getUserGroupCalls: exports.getUserGroupCalls,
  updateParticipantSettings: exports.updateParticipantSettings,
  endGroupCall: exports.endGroupCall
};