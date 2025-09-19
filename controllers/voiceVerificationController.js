const VoiceVerification = require('../models/voiceVerificationModel');
const User = require('../models/userModel');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory for voice files
const voiceUploadsDir = 'uploads/voice-verification';
if (!fs.existsSync(voiceUploadsDir)) {
    fs.mkdirSync(voiceUploadsDir, { recursive: true });
}

// Multer configuration for voice files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, voiceUploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const userId = req.user.id;
        cb(null, `voice-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files
        const allowedTypes = /wav|mp3|m4a|aac|ogg|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype.startsWith('audio/');
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed!'));
        }
    }
});

// Validation schemas
const voiceUploadSchema = Joi.object({
    deviceInfo: Joi.string().optional(),
    recordingEnvironment: Joi.string().valid('quiet', 'moderate', 'noisy').default('moderate')
});

// Voice verification phrases
const verificationPhrases = [
    "What is your favourite flower?",
    "My voice is unique and this is my verification",
    "I am creating my dating profile with my real voice",
    "This is my voice verification for authentication",
    "Hello, I am confirming my identity with my voice"
];

// Get random verification phrase
const getVerificationPhrase = (req, res) => {
    try {
        const randomPhrase = verificationPhrases[Math.floor(Math.random() * verificationPhrases.length)];
        
        res.status(200).json({
            success: true,
            data: {
                phrase: randomPhrase,
                instructions: [
                    "Please record yourself saying the phrase clearly",
                    "Speak in a quiet environment with minimal background noise",
                    "Use your natural speaking voice",
                    "Recording should be 3-10 seconds long",
                    "Make sure your microphone is working properly"
                ]
            }
        });
        
    } catch (error) {
        console.error('Get verification phrase error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get verification phrase'
        });
    }
};

// Upload and analyze voice
const uploadVoiceVerification = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Check if user is female (voice verification only required for females)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.gender !== 'Female') {
            return res.status(400).json({
                success: false,
                message: 'Voice verification is only required for female users'
            });
        }
        
        // Check if already verified
        if (user.voiceVerification.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Voice verification already completed'
            });
        }
        
        // Check attempt limit
        if (user.voiceVerification.attempts >= 3) {
            return res.status(400).json({
                success: false,
                message: 'Maximum verification attempts reached. Please contact support.'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No audio file provided'
            });
        }
        
        const { error, value } = voiceUploadSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }
        
        // Get file information
        const audioFile = req.file;
        const audioFileUrl = `/uploads/voice-verification/${audioFile.filename}`;
        
        // Get audio duration (simplified - in real app you'd use audio processing library)
        const audioDuration = await getAudioDuration(audioFile.path);
        
        // Validate audio duration
        if (audioDuration < 2 || audioDuration > 15) {
            // Delete the uploaded file
            fs.unlinkSync(audioFile.path);
            return res.status(400).json({
                success: false,
                message: 'Audio must be between 2-15 seconds long'
            });
        }
        
        // Delete existing verification record if exists
        await VoiceVerification.findOneAndDelete({ userId });
        
        // Create voice verification record
        const voiceVerification = new VoiceVerification({
            userId,
            audioFileUrl,
            audioFileName: audioFile.filename,
            audioFileSize: audioFile.size,
            audioDuration,
            verificationText: req.body.phrase || verificationPhrases[0],
            verificationStatus: 'processing',
            metadata: {
                deviceInfo: value.deviceInfo,
                recordingEnvironment: value.recordingEnvironment,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });
        
        await voiceVerification.save();
        
        // Update user's voice verification attempts
        user.voiceVerification.attempts += 1;
        user.voiceVerification.lastAttemptAt = new Date();
        await user.save();
        
        // Start voice analysis (in background)
        processVoiceVerification(voiceVerification._id);
        
        res.status(200).json({
            success: true,
            message: 'Voice uploaded successfully. Analysis in progress...',
            data: {
                verificationId: voiceVerification._id,
                status: 'processing',
                estimatedTime: '30-60 seconds'
            }
        });
        
    } catch (error) {
        console.error('Upload voice verification error:', error);
        
        // Clean up uploaded file if error occurs
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to upload voice verification'
        });
    }
};

// Check verification status
const checkVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { verificationId } = req.params;
        
        const voiceVerification = await VoiceVerification.findOne({
            _id: verificationId,
            userId
        });
        
        if (!voiceVerification) {
            return res.status(404).json({
                success: false,
                message: 'Voice verification not found'
            });
        }
        
        const user = await User.findById(userId);
        
        res.status(200).json({
            success: true,
            data: {
                status: voiceVerification.verificationStatus,
                isVerified: voiceVerification.isVerified,
                confidence: voiceVerification.confidence,
                detectedGender: voiceVerification.detectedGender,
                canRetry: voiceVerification.canRetry(),
                attemptsRemaining: 3 - user.voiceVerification.attempts,
                result: voiceVerification.verificationResult,
                failureReason: voiceVerification.failureReason,
                message: voiceVerification.getFailureMessage()
            }
        });
        
    } catch (error) {
        console.error('Check verification status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check verification status'
        });
    }
};

// Get verification requirements
const getVerificationRequirements = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                isRequired: user.voiceVerification.isRequired,
                isCompleted: user.voiceVerification.isCompleted,
                isVerified: user.voiceVerification.isVerified,
                attempts: user.voiceVerification.attempts,
                maxAttempts: 3,
                canAttempt: user.voiceVerification.attempts < 3,
                requirements: {
                    reason: "Voice verification is required for female users to ensure profile authenticity",
                    audioFormat: "MP3, WAV, M4A, AAC, OGG, or WebM",
                    duration: "2-15 seconds",
                    quality: "Clear speech in quiet environment",
                    fileSize: "Maximum 10MB"
                }
            }
        });
        
    } catch (error) {
        console.error('Get verification requirements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get verification requirements'
        });
    }
};

// Retry verification (for failed attempts)
const retryVerification = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.voiceVerification.attempts >= 3) {
            return res.status(400).json({
                success: false,
                message: 'Maximum verification attempts reached. Please contact support.'
            });
        }
        
        if (user.voiceVerification.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Voice verification already completed'
            });
        }
        
        // Delete previous verification record and file
        const previousVerification = await VoiceVerification.findOne({ userId });
        if (previousVerification) {
            // Delete audio file
            const filePath = path.join(voiceUploadsDir, previousVerification.audioFileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await VoiceVerification.findOneAndDelete({ userId });
        }
        
        res.status(200).json({
            success: true,
            message: 'Ready for new verification attempt',
            data: {
                attemptsRemaining: 3 - user.voiceVerification.attempts,
                phrase: verificationPhrases[Math.floor(Math.random() * verificationPhrases.length)]
            }
        });
        
    } catch (error) {
        console.error('Retry verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retry verification'
        });
    }
};

// Helper function to get audio duration (simplified)
async function getAudioDuration(filePath) {
    try {
        // In a real application, you would use a proper audio processing library
        // like node-ffmpeg, ffprobe, or audio-duration
        // For now, we'll estimate based on file size (very rough approximation)
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        
        // Rough estimate: assume ~128kbps bitrate
        // Duration ≈ (file size in bits) / (bitrate in bits per second)
        const estimatedDuration = (fileSizeInBytes * 8) / (128 * 1000);
        
        // Clamp between reasonable values
        return Math.max(1, Math.min(30, estimatedDuration));
    } catch (error) {
        console.error('Error getting audio duration:', error);
        return 5; // Default fallback
    }
}

// Voice analysis function (simplified - in real app would use AI/ML service)
async function processVoiceVerification(verificationId) {
    try {
        const verification = await VoiceVerification.findById(verificationId);
        if (!verification) return;
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Simplified analysis - in real app you would:
        // 1. Use speech recognition to verify the spoken text
        // 2. Use voice analysis API to determine gender characteristics
        // 3. Check audio quality and noise levels
        // 4. Analyze pitch, frequency, and other voice features
        
        const analysisResult = simulateVoiceAnalysis();
        
        verification.audioAnalysis = {
            fundamentalFrequency: analysisResult.f0,
            pitchRange: { min: analysisResult.pitchMin, max: analysisResult.pitchMax },
            spectralCentroid: analysisResult.spectralCentroid,
            voiceQualityScore: analysisResult.qualityScore,
            noiseLevel: analysisResult.noiseLevel,
            speechClarity: analysisResult.clarity
        };
        
        verification.detectedGender = analysisResult.detectedGender;
        verification.confidence = analysisResult.confidence;
        
        // Determine verification result
        if (analysisResult.detectedGender === 'female' && analysisResult.confidence >= 75) {
            await verification.markAsVerified(analysisResult.confidence);
            
            // Update user status
            const user = await User.findById(verification.userId);
            user.voiceVerification.isCompleted = true;
            user.voiceVerification.isVerified = true;
            user.voiceVerification.verifiedAt = new Date();
            user.profileCompletion.voiceVerification = true;
            await user.save();
            
        } else if (analysisResult.confidence < 60) {
            await verification.markAsFailed('poor_audio_quality', analysisResult.confidence);
        } else if (analysisResult.detectedGender !== 'female') {
            await verification.markAsFailed('voice_gender_mismatch', analysisResult.confidence);
        } else {
            await verification.markAsFailed('manual_review_required', analysisResult.confidence);
        }
        
    } catch (error) {
        console.error('Voice processing error:', error);
        
        // Mark as technical error
        const verification = await VoiceVerification.findById(verificationId);
        if (verification) {
            await verification.markAsFailed('technical_error', 0);
        }
    }
}

// Simplified voice analysis simulation
function simulateVoiceAnalysis() {
    // In real implementation, this would use actual voice analysis APIs
    const femaleVoiceCharacteristics = {
        f0Range: [165, 265], // Hz - typical female fundamental frequency
        spectralCentroidRange: [2000, 3500], // Hz
        qualityScoreRange: [70, 95]
    };
    
    // Simulate analysis results
    const f0 = femaleVoiceCharacteristics.f0Range[0] + 
               Math.random() * (femaleVoiceCharacteristics.f0Range[1] - femaleVoiceCharacteristics.f0Range[0]);
    
    const spectralCentroid = femaleVoiceCharacteristics.spectralCentroidRange[0] + 
                           Math.random() * (femaleVoiceCharacteristics.spectralCentroidRange[1] - femaleVoiceCharacteristics.spectralCentroidRange[0]);
    
    const qualityScore = femaleVoiceCharacteristics.qualityScoreRange[0] + 
                        Math.random() * (femaleVoiceCharacteristics.qualityScoreRange[1] - femaleVoiceCharacteristics.qualityScoreRange[0]);
    
    // Determine gender based on voice characteristics
    let detectedGender = 'unknown';
    let confidence = 0;
    
    if (f0 >= 160 && f0 <= 280 && spectralCentroid >= 1800) {
        detectedGender = 'female';
        confidence = Math.min(95, 60 + ((f0 - 160) / 120) * 35 + Math.random() * 10);
    } else if (f0 >= 85 && f0 <= 180 && spectralCentroid <= 2200) {
        detectedGender = 'male';
        confidence = Math.min(95, 60 + ((180 - f0) / 95) * 35 + Math.random() * 10);
    } else {
        detectedGender = 'unknown';
        confidence = Math.random() * 50;
    }
    
    return {
        f0: Math.round(f0),
        pitchMin: Math.round(f0 - 20),
        pitchMax: Math.round(f0 + 30),
        spectralCentroid: Math.round(spectralCentroid),
        qualityScore: Math.round(qualityScore),
        noiseLevel: Math.round(Math.random() * 30),
        clarity: Math.round(60 + Math.random() * 35),
        detectedGender,
        confidence: Math.round(confidence)
    };
}

module.exports = {
    getVerificationPhrase,
    uploadVoiceVerification: [upload.single('voiceFile'), uploadVoiceVerification],
    checkVerificationStatus,
    getVerificationRequirements,
    retryVerification
};