const Match = require('../models/matchModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const joi = require('joi');

// Swipe on a user (like/dislike/superlike)
exports.swipeUser = async (req, res) => {
  try {
    const schema = joi.object({
      targetUserId: joi.string().required(),
      action: joi.string().valid('like', 'dislike', 'superlike').required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { targetUserId, action } = req.body;
    const currentUserId = req.user._id;

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Prevent self-swiping
    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot swipe on yourself'
      });
    }

    // Handle superlike coin deduction
    if (action === 'superlike') {
      if (req.user.coins < 5) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient coins for superlike'
        });
      }
      
      // Deduct coins for superlike
      await User.findByIdAndUpdate(currentUserId, { $inc: { coins: -5 } });
      
      // Create transaction record
      await Transaction.create({
        userId: currentUserId,
        type: 'deduction',
        purpose: 'super_like',
        amount: 5,
        balanceBefore: req.user.coins,
        balanceAfter: req.user.coins - 5,
        activityDetails: { targetUserId }
      });
    }

    // Create or update match record
    let match = await Match.findOne({
      $or: [
        { user1: currentUserId, user2: targetUserId },
        { user1: targetUserId, user2: currentUserId }
      ]
    });

    if (match) {
      // Update existing match
      if (match.user1.toString() === currentUserId.toString()) {
        match.user1Action = action;
      } else {
        match.user2Action = action;
      }
    } else {
      // Create new match record
      match = new Match({
        user1: currentUserId,
        user2: targetUserId,
        user1Action: action,
        user2Action: 'pending'
      });
    }

    // Check if it's a match
    const isMatch = match.checkMatch();
    await match.save();

    let responseData = {
      success: true,
      message: `${action} recorded successfully`,
      isMatch,
      matchId: match._id
    };

    if (isMatch) {
      responseData.message = "It's a match! 🎉";
      responseData.matchedUser = {
        id: targetUser._id,
        username: targetUser.username,
        profilePictures: targetUser.profilePictures[0] || null
      };
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Swipe user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get potential matches for the user
exports.getPotentialMatches = async (req, res) => {
  try {
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users that current user has already swiped on
    const existingMatches = await Match.find({
      $or: [
        { user1: currentUser._id },
        { user2: currentUser._id }
      ]
    }).select('user1 user2');

    const swipedUserIds = existingMatches.map(match => 
      match.user1.toString() === currentUser._id.toString() ? match.user2 : match.user1
    );

    // Build query for potential matches
    let matchQuery = {
      _id: { $ne: currentUser._id, $nin: swipedUserIds },
      isBlocked: false,
      gender: currentUser.preferences.interestedIn === 'Both' ? 
        { $in: ['Male', 'Female'] } : currentUser.preferences.interestedIn
    };

    // Age filter
    if (currentUser.preferences.ageRange) {
      matchQuery.age = {
        $gte: currentUser.preferences.ageRange.min,
        $lte: currentUser.preferences.ageRange.max
      };
    }

    // Location filter (if user has location)
    if (currentUser.location && currentUser.location.coordinates[0] !== 0) {
      matchQuery.location = {
        $geoWithin: {
          $centerSphere: [
            currentUser.location.coordinates,
            (currentUser.preferences.maxDistance || 50) / 6371 // Convert km to radians (divide by Earth's radius)
          ]
        }
      };
    }

    const potentialMatches = await User.find(matchQuery)
      .select('username age bio profilePictures location.city isOnline lastSeen')
      .sort({ isOnline: -1, lastSeen: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: potentialMatches,
      pagination: {
        page,
        limit,
        total: potentialMatches.length
      },
      message: 'Potential matches retrieved successfully'
    });

  } catch (error) {
    console.error('Get potential matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's matches
exports.getMatches = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const matches = await Match.find({
      $or: [
        { user1: currentUserId },
        { user2: currentUserId }
      ],
      isMatch: true,
      isActive: true
    })
    .populate('user1', 'username profilePictures isOnline lastSeen')
    .populate('user2', 'username profilePictures isOnline lastSeen')
    .sort({ matchedAt: -1 })
    .skip(skip)
    .limit(limit);

    const matchedUsers = matches.map(match => {
      const otherUser = match.user1._id.toString() === currentUserId.toString() ? 
        match.user2 : match.user1;
      
      return {
        matchId: match._id,
        user: otherUser,
        matchedAt: match.matchedAt
      };
    });

    res.status(200).json({
      success: true,
      data: matchedUsers,
      pagination: {
        page,
        limit,
        total: matchedUsers.length
      },
      message: 'Matches retrieved successfully'
    });

  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Unmatch a user
exports.unmatchUser = async (req, res) => {
  try {
    const { matchId } = req.params;
    const currentUserId = req.user._id;

    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user1: currentUserId },
        { user2: currentUserId }
      ],
      isMatch: true
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    match.isActive = false;
    await match.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unmatched'
    });

  } catch (error) {
    console.error('Unmatch user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  swipeUser: exports.swipeUser,
  getPotentialMatches: exports.getPotentialMatches,
  getMatches: exports.getMatches,
  unmatchUser: exports.unmatchUser
};