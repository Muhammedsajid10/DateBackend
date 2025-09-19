const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true, unique: true },
  username: { type: String, maxlength: 50 },
  email: { type: String, lowercase: true },
  dateOfBirth: { type: Date },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female'], default: 'Female' },
  language: { type: String, default: 'English' },
  bio: { type: String, maxlength: 500 },
  profilePictures: [{ type: String }], // URLs to uploaded images
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    city: String,
    state: String,
    country: String
  },
  preferences: {
    ageRange: { min: { type: Number, default: 18 }, max: { type: Number, default: 50 } },
    maxDistance: { type: Number, default: 50 }, // in kilometers
    interestedIn: { type: String, enum: ['Male', 'Female', 'Both'], default: 'Male' }
  },
  // Dating app specific fields
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  coins: { type: Number, default: 100 }, // Starting coins for new users
  isPremium: { type: Boolean, default: false },
  
  // Security and moderation
  isBlocked: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
  
  // Voice verification (for female users)
  voiceVerification: {
    isRequired: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    verifiedAt: { type: Date }
  },
  
  // Profile completion status
  profileCompletion: {
    basicInfo: { 
      isComplete: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    photos: { 
      isComplete: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    voiceVerification: { 
      isComplete: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    kyc: {
      isComplete: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    avatar: {
      isComplete: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    isComplete: { type: Boolean, default: false },
    completedAt: { type: Date }
  },
  
  // Bank account details (for girls to withdraw coins)
  bankAccount: {
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    isVerified: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Index for geospatial queries
UserSchema.index({ location: '2dsphere' });
// Index for efficient filtering
UserSchema.index({ gender: 1, age: 1, 'location.city': 1 });

// Calculate age from date of birth
UserSchema.pre('save', function(next) {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  
  // Set voice verification requirement for female users
  if (this.gender === 'Female') {
    this.voiceVerification.isRequired = true;
  } else {
    this.voiceVerification.isRequired = false;
    this.voiceVerification.isCompleted = true;
    this.voiceVerification.isVerified = true;
    this.profileCompletion.voiceVerification.isComplete = true;
    if (!this.profileCompletion.voiceVerification.completedAt) {
      this.profileCompletion.voiceVerification.completedAt = new Date();
    }
  }
  
  // Update profile completion status
  const basicInfoComplete = !!(this.username && this.dateOfBirth && this.gender);
  if (basicInfoComplete && !this.profileCompletion.basicInfo.isComplete) {
    this.profileCompletion.basicInfo.isComplete = true;
    this.profileCompletion.basicInfo.completedAt = new Date();
  }
  
  const photosComplete = this.profilePictures && this.profilePictures.length > 0;
  if (photosComplete && !this.profileCompletion.photos.isComplete) {
    this.profileCompletion.photos.isComplete = true;
    this.profileCompletion.photos.completedAt = new Date();
  }
  
  // Profile is complete when all required steps are done
  const allStepsComplete = 
    this.profileCompletion.basicInfo.isComplete && 
    this.profileCompletion.photos.isComplete && 
    this.profileCompletion.voiceVerification.isComplete &&
    this.profileCompletion.kyc.isComplete &&
    this.profileCompletion.avatar.isComplete;
    
  if (allStepsComplete && !this.profileCompletion.isComplete) {
    this.profileCompletion.isComplete = true;
    this.profileCompletion.completedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('User', UserSchema);