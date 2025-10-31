const User = require('../models/userModel');
const joi = require('joi');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const schema = joi.object({
      username: joi.string().min(2).max(50),
      dateOfBirth: joi.date().max('now'),
      gender: joi.string().valid('Male', 'Female'),
      bio: joi.string().max(500),
      language: joi.string(),
      email: joi.string().email(),
      location: joi.object({
        city: joi.string(),
        state: joi.string(),
        country: joi.string(),
        coordinates: joi.array().items(joi.number()).length(2)
      }),
      preferences: joi.object({
        ageRange: joi.object({
          min: joi.number().min(18).max(100),
          max: joi.number().min(18).max(100)
        }),
        maxDistance: joi.number().min(1).max(500),
        interestedIn: joi.string().valid('Male', 'Female', 'Both')
      })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const updateData = { ...req.body };
    
    // Update location with proper GeoJSON format if coordinates provided
    if (updateData.location && updateData.location.coordinates) {
      updateData.location.type = 'Point';
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
      profileCompletion: {
        basicInfo: user.profileCompletion.basicInfo,
        photos: user.profileCompletion.photos,
        voiceVerification: user.profileCompletion.voiceVerification,
        isComplete: user.profileCompletion.isComplete,
        nextStep: getNextProfileStep(user)
      }
    });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: err.message
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile retrieved successfully',
      profileCompletion: {
        basicInfo: user.profileCompletion.basicInfo,
        photos: user.profileCompletion.photos,
        voiceVerification: user.profileCompletion.voiceVerification,
        isComplete: user.profileCompletion.isComplete,
        nextStep: getNextProfileStep(user)
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get profile completion status
exports.getProfileCompletionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('username dateOfBirth gender profilePictures voiceVerification profileCompletion');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const nextStep = getNextProfileStep(user);
    
    res.status(200).json({
      success: true,
      data: {
        steps: {
          basicInfo: {
            isComplete: user.profileCompletion.basicInfo.isComplete,
            required: true,
            description: 'Complete basic information (name, date of birth, gender)',
            completedAt: user.profileCompletion.basicInfo.completedAt
          },
          photos: {
            isComplete: user.profileCompletion.photos.isComplete,
            required: true,
            description: 'Upload at least one profile photo',
            completedAt: user.profileCompletion.photos.completedAt
          },
          voiceVerification: {
            isComplete: user.profileCompletion.voiceVerification.isComplete,
            required: user.voiceVerification.isRequired,
            description: user.voiceVerification.isRequired ? 
              'Voice verification required for female users' : 'Voice verification not required',
            attempts: user.voiceVerification.attempts,
            maxAttempts: 3,
            canAttempt: user.voiceVerification.attempts < 3,
            completedAt: user.profileCompletion.voiceVerification.completedAt
          },
          kyc: {
            isComplete: user.profileCompletion.kyc.isComplete,
            required: true,
            description: 'Complete KYC verification with Aadhaar card documents',
            completedAt: user.profileCompletion.kyc.completedAt
          },
          avatar: {
            isComplete: user.profileCompletion.avatar.isComplete,
            required: true,
            description: 'Pick your avatar to complete profile setup',
            completedAt: user.profileCompletion.avatar.completedAt
          }
        },
        overall: {
          isComplete: user.profileCompletion.isComplete,
          completionPercentage: calculateCompletionPercentage(user),
          nextStep: nextStep,
          completedAt: user.profileCompletion.completedAt
        }
      }
    });

  } catch (err) {
    console.error('Get profile completion status error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile completion status',
      error: err.message
    });
  }
};

// Helper function to determine next profile step
function getNextProfileStep(user) {
  if (!user.profileCompletion.basicInfo.isComplete) {
    return {
      step: 'basicInfo',
      title: 'Complete Basic Information',
      description: 'Please provide your name, date of birth, and gender',
      action: 'update_profile'
    };
  }
  
  if (!user.profileCompletion.photos.isComplete) {
    return {
      step: 'photos',
      title: 'Upload Profile Photos',
      description: 'Add at least one profile photo to continue',
      action: 'upload_photos'
    };
  }
  
  if (user.voiceVerification.isRequired && !user.profileCompletion.voiceVerification.isComplete) {
    if (user.voiceVerification.attempts >= 3) {
      return {
        step: 'voiceVerification',
        title: 'Voice Verification - Contact Support',
        description: 'Maximum attempts reached. Please contact support for assistance.',
        action: 'contact_support'
      };
    }
    
    return {
      step: 'voiceVerification',
      title: 'Voice Verification Required',
      description: 'Female users must complete voice verification to ensure profile authenticity',
      action: 'voice_verification',
      attemptsRemaining: 3 - user.voiceVerification.attempts
    };
  }
  
  if (!user.profileCompletion.kyc.isComplete) {
    return {
      step: 'kyc',
      title: 'KYC Verification Required',
      description: 'Complete your KYC verification by uploading Aadhaar card documents',
      action: 'kyc_verification'
    };
  }
  
  if (!user.profileCompletion.avatar.isComplete) {
    return {
      step: 'avatar',
      title: 'Pick Your Avatar',
      description: 'Select an avatar to represent yourself in the app',
      action: 'select_avatar'
    };
  }
  
  return {
    step: 'complete',
    title: 'Profile Complete!',
    description: 'Your profile is complete! You can now use all app features and start connecting.',
    action: 'start_app'
  };
}

// Helper function to calculate completion percentage
function calculateCompletionPercentage(user) {
  let totalSteps = 4; // basicInfo, photos, kyc, avatar
  let completedSteps = 0;
  
  // Add voice verification for female users
  if (user.voiceVerification.isRequired) {
    totalSteps += 1;
  }
  
  if (user.profileCompletion.basicInfo.isComplete) completedSteps += 1;
  if (user.profileCompletion.photos.isComplete) completedSteps += 1;
  if (user.profileCompletion.voiceVerification.isComplete) completedSteps += 1;
  if (user.profileCompletion.kyc.isComplete) completedSteps += 1;
  if (user.profileCompletion.avatar.isComplete) completedSteps += 1;
  
  return Math.round((completedSteps / totalSteps) * 100);
}

// Get another user's profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('username age bio profilePictures location.city isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User profile retrieved successfully'
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload profile pictures
exports.uploadProfilePictures = [
  upload.array('photos', 5), // Allow up to 5 photos
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Get file URLs
      const photoUrls = req.files.map(file => `/uploads/${file.filename}`);
      
      // Update user profile
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $push: { profilePictures: { $each: photoUrls } } },
        { new: true }
      ).select('profilePictures');

      res.status(200).json({
        success: true,
        data: {
          uploadedPhotos: photoUrls,
          allPhotos: user.profilePictures
        },
        message: 'Photos uploaded successfully'
      });

    } catch (error) {
      console.error('Upload photos error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading photos'
      });
    }
  }
];

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Photo URL is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { profilePictures: photoUrl } },
      { new: true }
    ).select('profilePictures');

    res.status(200).json({
      success: true,
      data: user.profilePictures,
      message: 'Photo deleted successfully'
    });

  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting photo'
    });
  }
};

// Search and filter users
exports.searchUsers = async (req, res) => {
  try {
    const schema = joi.object({
      gender: joi.string().valid('Male', 'Female'),
      minAge: joi.number().min(18).max(100),
      maxAge: joi.number().min(18).max(100),
      city: joi.string(),
      maxDistance: joi.number().min(1).max(500),
      isOnline: joi.boolean(),
      page: joi.number().min(1).default(1),
      limit: joi.number().min(1).max(50).default(20)
    });

    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { gender, minAge, maxAge, city, maxDistance, isOnline, page, limit } = value;
    const skip = (page - 1) * limit;
    const currentUser = req.user;

    // Build search query
    let searchQuery = {
      _id: { $ne: currentUser._id },
      isBlocked: false
    };

    if (gender) {
      searchQuery.gender = gender;
    }

    if (minAge || maxAge) {
      searchQuery.age = {};
      if (minAge) searchQuery.age.$gte = minAge;
      if (maxAge) searchQuery.age.$lte = maxAge;
    }

    if (city) {
      searchQuery['location.city'] = new RegExp(city, 'i');
    }

    if (isOnline !== undefined) {
      searchQuery.isOnline = isOnline;
    }

    // Location-based search
    if (maxDistance && currentUser.location && currentUser.location.coordinates[0] !== 0) {
      searchQuery.location = {
        $geoWithin: {
          $centerSphere: [
            currentUser.location.coordinates,
            maxDistance / 6371 // Convert km to radians (divide by Earth's radius)
          ]
        }
      };
    }

    const users = await User.find(searchQuery)
      .select('username age bio profilePictures location.city isOnline lastSeen')
      .sort({ isOnline: -1, lastSeen: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'Users retrieved successfully'
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get random online users
exports.getRandomOnlineUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const currentUser = req.user;

    const randomUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUser._id },
          isOnline: true,
          isBlocked: false
        }
      },
      { $sample: { size: limit } },
      {
        $project: {
          username: 1,
          age: 1,
          bio: 1,
          profilePictures: 1,
          'location.city': 1,
          isOnline: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: randomUsers,
      message: 'Random online users retrieved successfully'
    });

  } catch (error) {
    console.error('Get random online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update online status
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    const updateData = {
      isOnline: !!isOnline,
      lastSeen: new Date()
    };

    await User.findByIdAndUpdate(req.user._id, updateData);

    res.status(200).json({
      success: true,
      message: 'Online status updated successfully'
    });

  } catch (error) {
    console.error('Update online status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  updateProfile: exports.updateProfile,
  getProfile: exports.getProfile,
  getProfileCompletionStatus: exports.getProfileCompletionStatus,
  getUserProfile: exports.getUserProfile,
  uploadProfilePictures: exports.uploadProfilePictures,
  deleteProfilePicture: exports.deleteProfilePicture,
  searchUsers: exports.searchUsers,
  getRandomOnlineUsers: exports.getRandomOnlineUsers,
  updateOnlineStatus: exports.updateOnlineStatus
};