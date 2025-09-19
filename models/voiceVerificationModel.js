const mongoose = require('mongoose');

const voiceVerificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
        // Removed index: false as it conflicts with unique: true
    },
    audioFileUrl: {
        type: String,
        required: true
    },
    audioFileName: {
        type: String,
        required: true
    },
    audioFileSize: {
        type: Number,
        required: true
    },
    audioDuration: {
        type: Number, // in seconds
        required: true
    },
    verificationText: {
        type: String,
        required: true,
        default: "What is your favourite flower?"
    },
    detectedGender: {
        type: String,
        enum: ['male', 'female', 'unknown'],
        default: 'unknown'
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'processing', 'verified', 'failed', 'rejected'],
        default: 'pending'
    },
    verificationAttempts: {
        type: Number,
        default: 1,
        max: 3
    },
    failureReason: {
        type: String,
        enum: [
            'voice_gender_mismatch',
            'poor_audio_quality',
            'background_noise',
            'insufficient_speech',
            'technical_error',
            'manual_review_required'
        ]
    },
    manualReview: {
        required: {
            type: Boolean,
            default: false
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' // Admin user
        },
        reviewedAt: {
            type: Date
        },
        reviewNotes: {
            type: String,
            maxlength: 500
        },
        reviewDecision: {
            type: String,
            enum: ['approved', 'rejected', 'needs_resubmission']
        }
    },
    audioAnalysis: {
        fundamentalFrequency: {
            type: Number // Average F0 in Hz
        },
        pitchRange: {
            min: Number,
            max: Number
        },
        spectralCentroid: {
            type: Number // in Hz
        },
        voiceQualityScore: {
            type: Number,
            min: 0,
            max: 100
        },
        noiseLevel: {
            type: Number,
            min: 0,
            max: 100
        },
        speechClarity: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    metadata: {
        deviceInfo: {
            type: String
        },
        recordingEnvironment: {
            type: String,
            enum: ['quiet', 'moderate', 'noisy']
        },
        ipAddress: {
            type: String
        },
        userAgent: {
            type: String
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }
    }
}, {
    timestamps: { updatedAt: 'updatedAt' }
});

// Indexes for better performance
voiceVerificationSchema.index({ userId: 1 });
voiceVerificationSchema.index({ verificationStatus: 1 });
voiceVerificationSchema.index({ createdAt: -1 });
voiceVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for verification result
voiceVerificationSchema.virtual('verificationResult').get(function() {
    if (this.verificationStatus === 'verified') {
        return {
            status: 'success',
            message: 'Voice verification successful',
            confidence: this.confidence
        };
    } else if (this.verificationStatus === 'failed') {
        return {
            status: 'failed',
            message: this.getFailureMessage(),
            canRetry: this.verificationAttempts < 3
        };
    } else {
        return {
            status: this.verificationStatus,
            message: 'Verification in progress'
        };
    }
});

// Method to get user-friendly failure message
voiceVerificationSchema.methods.getFailureMessage = function() {
    const messages = {
        'voice_gender_mismatch': 'Voice characteristics do not match selected gender. Please ensure you are speaking clearly.',
        'poor_audio_quality': 'Audio quality is too low. Please record in a quiet environment with good microphone quality.',
        'background_noise': 'Too much background noise detected. Please record in a quieter environment.',
        'insufficient_speech': 'Not enough speech detected. Please speak the full phrase clearly.',
        'technical_error': 'Technical error occurred during analysis. Please try again.',
        'manual_review_required': 'Your submission requires manual review. This may take 24-48 hours.'
    };
    return messages[this.failureReason] || 'Verification failed. Please try again.';
};

// Method to check if user can retry
voiceVerificationSchema.methods.canRetry = function() {
    return this.verificationAttempts < 3 && this.verificationStatus !== 'verified';
};

// Method to increment attempt
voiceVerificationSchema.methods.incrementAttempt = function() {
    this.verificationAttempts += 1;
    this.updatedAt = new Date();
    return this.save();
};

// Method to mark as verified
voiceVerificationSchema.methods.markAsVerified = function(confidence = 85) {
    this.isVerified = true;
    this.verificationStatus = 'verified';
    this.confidence = confidence;
    this.updatedAt = new Date();
    return this.save();
};

// Method to mark as failed
voiceVerificationSchema.methods.markAsFailed = function(reason, confidence = 0) {
    this.isVerified = false;
    this.verificationStatus = 'failed';
    this.failureReason = reason;
    this.confidence = confidence;
    this.updatedAt = new Date();
    return this.save();
};

// Static method to get verification statistics
voiceVerificationSchema.statics.getVerificationStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$verificationStatus',
                count: { $sum: 1 },
                avgConfidence: { $avg: '$confidence' }
            }
        }
    ]);
};

// Pre-save middleware
voiceVerificationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const VoiceVerification = mongoose.model('VoiceVerification', voiceVerificationSchema);
module.exports = VoiceVerification;