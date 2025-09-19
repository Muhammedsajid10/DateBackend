const User = require('../models/userModel');
const KYC = require('../models/kycModel');
const Joi = require('joi');
const fs = require('fs').promises;
const path = require('path');

// Validation schemas
const personalInfoSchema = Joi.object({
    registeredName: Joi.string().min(2).max(50).required(),
    mobileNumber: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s]+$/).optional(),
    emailId: Joi.string().email().required()
});

const bankDetailsSchema = Joi.object({
    registeredName: Joi.string().min(2).max(50).required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    accountNumber: Joi.string().min(9).max(20).required()
});

// Step 1: Submit Personal Information
exports.submitPersonalInfo = async (req, res) => {
    try {
        const { error, value } = personalInfoSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details[0].message
            });
        }
        
        // Check if user exists
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Create or update KYC record
        let kyc = await KYC.findOneAndUpdate(
            { userId: req.user.userId },
            {
                'personalInfo.registeredName': value.registeredName,
                'personalInfo.mobileNumber': value.mobileNumber,
                'personalInfo.phoneNumber': value.phoneNumber,
                'personalInfo.emailId': value.emailId,
                'personalInfo.isComplete': true,
                'verification.currentStep': 1
            },
            { upsert: true, new: true, runValidators: true }
        );
        
        const nextStep = kyc.getNextStep();
        
        res.json({
            success: true,
            message: 'Personal information saved successfully',
            data: {
                currentStep: kyc.verification.currentStep,
                completionPercentage: kyc.getCompletionPercentage(),
                nextStep: nextStep,
                personalInfo: kyc.personalInfo
            }
        });
        
    } catch (error) {
        console.error('Submit personal info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save personal information'
        });
    }
};

// Step 2: Submit Bank Details
exports.submitBankDetails = async (req, res) => {
    try {
        const { error, value } = bankDetailsSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details[0].message
            });
        }
        
        // Find existing KYC record
        let kyc = await KYC.findOne({ userId: req.user.userId });
        if (!kyc || !kyc.personalInfo.isComplete) {
            return res.status(400).json({
                success: false,
                message: 'Please complete personal information first'
            });
        }
        
        // Update bank details
        kyc.bankDetails = {
            registeredName: value.registeredName,
            ifscCode: value.ifscCode,
            accountNumber: value.accountNumber,
            isComplete: true
        };
        
        await kyc.save();
        
        const nextStep = kyc.getNextStep();
        
        res.json({
            success: true,
            message: 'Bank details saved successfully',
            data: {
                currentStep: kyc.verification.currentStep,
                completionPercentage: kyc.getCompletionPercentage(),
                nextStep: nextStep,
                bankDetails: {
                    registeredName: kyc.bankDetails.registeredName,
                    ifscCode: kyc.bankDetails.ifscCode,
                    accountNumber: '****' + kyc.bankDetails.accountNumber.slice(-4)
                }
            }
        });
        
    } catch (error) {
        console.error('Submit bank details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save bank details'
        });
    }
};

// Step 3: Upload Aadhaar Card Documents
exports.uploadAadhaarCard = async (req, res) => {
    try {
        const { documentSide } = req.body; // 'front' or 'back'
        
        if (!['front', 'back'].includes(documentSide)) {
            return res.status(400).json({
                success: false,
                message: 'Document side must be either "front" or "back"'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No document image uploaded'
            });
        }
        
        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Only JPEG, PNG, and WebP images are allowed'
            });
        }
        
        // Find existing KYC record
        let kyc = await KYC.findOne({ userId: req.user.userId });
        if (!kyc || !kyc.personalInfo.isComplete || !kyc.bankDetails.isComplete) {
            return res.status(400).json({
                success: false,
                message: 'Please complete previous steps first'
            });
        }
        
        // Store document info
        const documentInfo = {
            filename: req.file.filename,
            path: req.file.path,
            uploadedAt: new Date(),
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        };
        
        if (documentSide === 'front') {
            kyc.aadhaarCard.frontImage = documentInfo;
        } else {
            kyc.aadhaarCard.backImage = documentInfo;
        }
        
        // Check if both images are uploaded
        const bothUploaded = kyc.aadhaarCard.frontImage && kyc.aadhaarCard.backImage;
        if (bothUploaded) {
            kyc.aadhaarCard.isUploaded = true;
            // Simulate OCR processing
            await simulateOCRProcessing(kyc);
        }
        
        await kyc.save();
        
        const nextStep = kyc.getNextStep();
        
        res.json({
            success: true,
            message: `Aadhaar card ${documentSide} image uploaded successfully`,
            data: {
                documentSide: documentSide,
                isUploaded: !!kyc.aadhaarCard[`${documentSide}Image`],
                bothImagesUploaded: bothUploaded,
                currentStep: kyc.verification.currentStep,
                completionPercentage: kyc.getCompletionPercentage(),
                nextStep: nextStep,
                uploadedImages: {
                    front: !!kyc.aadhaarCard.frontImage,
                    back: !!kyc.aadhaarCard.backImage
                }
            }
        });
        
    } catch (error) {
        console.error('Upload Aadhaar card error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload document'
        });
    }
};

// Get KYC Status and Progress
exports.getKYCStatus = async (req, res) => {
    try {
        let kyc = await KYC.findOne({ userId: req.user.userId });
        
        if (!kyc) {
            // Create new KYC record
            kyc = new KYC({ userId: req.user.userId });
            await kyc.save();
        }
        
        const nextStep = kyc.getNextStep();
        
        res.json({
            success: true,
            data: {
                verification: {
                    status: kyc.verification.status,
                    currentStep: kyc.verification.currentStep,
                    isComplete: kyc.verification.isComplete,
                    submittedAt: kyc.verification.submittedAt,
                    verifiedAt: kyc.verification.verifiedAt
                },
                progress: {
                    completionPercentage: kyc.getCompletionPercentage(),
                    nextStep: nextStep
                },
                steps: {
                    personalInfo: {
                        isComplete: kyc.personalInfo.isComplete,
                        data: kyc.personalInfo.isComplete ? {
                            registeredName: kyc.personalInfo.registeredName,
                            mobileNumber: kyc.personalInfo.mobileNumber,
                            emailId: kyc.personalInfo.emailId
                        } : null
                    },
                    bankDetails: {
                        isComplete: kyc.bankDetails.isComplete,
                        data: kyc.bankDetails.isComplete ? {
                            registeredName: kyc.bankDetails.registeredName,
                            ifscCode: kyc.bankDetails.ifscCode,
                            accountNumber: '****' + kyc.bankDetails.accountNumber.slice(-4)
                        } : null
                    },
                    documents: {
                        isUploaded: kyc.aadhaarCard.isUploaded,
                        isVerified: kyc.aadhaarCard.isVerified,
                        uploadedImages: {
                            front: !!kyc.aadhaarCard.frontImage,
                            back: !!kyc.aadhaarCard.backImage
                        },
                        extractedData: kyc.aadhaarCard.extractedData || null
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Get KYC status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get KYC status'
        });
    }
};

// Check verification status
exports.checkVerificationStatus = async (req, res) => {
    try {
        const kyc = await KYC.findOne({ userId: req.user.userId });
        
        if (!kyc) {
            return res.status(404).json({
                success: false,
                message: 'KYC record not found'
            });
        }
        
        if (kyc.verification.status === 'processing') {
            // Simulate processing completion (in real app, this would be updated by OCR service)
            if (kyc.aadhaarCard.isUploaded && !kyc.aadhaarCard.isVerified) {
                // Random verification after 30 seconds of processing
                const timeSinceSubmission = new Date() - kyc.verification.submittedAt;
                if (timeSinceSubmission > 30000) { // 30 seconds
                    await completeVerification(kyc);
                }
            }
        }
        
        res.json({
            success: true,
            data: {
                status: kyc.verification.status,
                isComplete: kyc.verification.isComplete,
                isVerified: kyc.aadhaarCard.isVerified,
                verificationMessage: kyc.aadhaarCard.verificationMessage,
                extractedData: kyc.aadhaarCard.extractedData,
                autoVerification: kyc.autoVerification
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

// Simulate OCR Processing (replace with actual OCR service)
async function simulateOCRProcessing(kyc) {
    try {
        // Simulate OCR data extraction
        const mockExtractedData = {
            aadhaarNumber: '1234 5678 9012',
            name: kyc.personalInfo.registeredName,
            dateOfBirth: new Date('1990-01-01'),
            gender: 'Male', // This would come from actual OCR
            address: '123 Main Street, City, State 123456',
            fatherName: 'Father Name'
        };
        
        kyc.aadhaarCard.extractedData = mockExtractedData;
        kyc.verification.status = 'processing';
        kyc.verification.submittedAt = new Date();
        
        // Simulate processing time
        setTimeout(async () => {
            await completeVerification(kyc);
        }, 30000); // 30 seconds
        
    } catch (error) {
        console.error('OCR processing simulation error:', error);
    }
}

// Complete verification process
async function completeVerification(kyc) {
    try {
        // Simulate auto-verification checks
        kyc.autoVerification = {
            nameMatch: kyc.aadhaarCard.extractedData.name.toLowerCase() === kyc.personalInfo.registeredName.toLowerCase(),
            documentQuality: Math.floor(Math.random() * 20) + 80, // 80-100 score
            ocrConfidence: Math.floor(Math.random() * 15) + 85, // 85-100 score
            duplicateCheck: false,
            blacklistCheck: false
        };
        
        // Determine verification result
        const passedChecks = kyc.autoVerification.nameMatch && 
                           kyc.autoVerification.documentQuality >= 75 && 
                           kyc.autoVerification.ocrConfidence >= 80 &&
                           !kyc.autoVerification.duplicateCheck &&
                           !kyc.autoVerification.blacklistCheck;
        
        if (passedChecks) {
            kyc.verification.status = 'verified';
            kyc.verification.isComplete = true;
            kyc.verification.verifiedAt = new Date();
            kyc.aadhaarCard.isVerified = true;
            kyc.aadhaarCard.verificationMessage = 'Document verification successful';
        } else {
            kyc.verification.status = 'rejected';
            kyc.verification.rejectedAt = new Date();
            kyc.verification.rejectReason = 'Document verification failed';
            kyc.aadhaarCard.verificationMessage = 'Document verification failed. Please upload clear images.';
        }
        
        await kyc.save();
        
        // Update user's KYC completion status
        if (kyc.verification.status === 'verified') {
            await User.findByIdAndUpdate(kyc.userId, {
                'profileCompletion.kyc.isComplete': true,
                'profileCompletion.kyc.completedAt': new Date()
            });
        }
        
    } catch (error) {
        console.error('Complete verification error:', error);
    }
}
