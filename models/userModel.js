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
  profilePictures: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    city: String,
    state: String,
    country: String
  },
  preferences: {
    ageRange: { min: { type: Number, default: 18 }, max: { type: Number, default: 50 } },
    maxDistance: { type: Number, default: 50 },
    interestedIn: { type: String, enum: ['Male', 'Female', 'Both'], default: 'Male' }
  },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  coins: { type: Number, default: 100 },
  isPremium: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
  voiceVerification: {
    isRequired: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    verifiedAt: { type: Date }
  },
  
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

UserSchema.index({ location: '2dsphere' });
UserSchema.index({ gender: 1, age: 1, 'location.city': 1 });
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