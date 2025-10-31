const mongoose = require('mongoose');

const KYCSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    
    personalInfo: {
        registeredName: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        phoneNumber: String,
        emailId: { type: String, required: true },
        isComplete: { type: Boolean, default: false }
    },
    
    bankDetails: {
        registeredName: { type: String, required: true },
        ifscCode: { type: String, required: true },
        accountNumber: { type: String, required: true },
        isComplete: { type: Boolean, default: false }
    },
    
    aadhaarCard: {
        frontImage: {
            filename: String,
            path: String,
            uploadedAt: Date,
            fileSize: Number,
            mimeType: String
        },
        backImage: {
            filename: String,
            path: String,
            uploadedAt: Date,
            fileSize: Number,
            mimeType: String
        },
        extractedData: {
            aadhaarNumber: String,
            name: String,
            dateOfBirth: Date,
            gender: String,
            address: String,
            fatherName: String
        },
        isUploaded: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false },
        verificationMessage: String
    },
    
    verification: {
        status: { 
            type: String, 
            enum: ['not_started', 'personal_info', 'bank_details', 'document_upload', 'processing', 'verified', 'rejected'],
            default: 'not_started'
        },
        currentStep: { type: Number, default: 1 },
        submittedAt: Date,
        verifiedAt: Date,
        rejectedAt: Date,
        rejectReason: String,
        isComplete: { type: Boolean, default: false },
        notes: String
    },
    
    autoVerification: {
        nameMatch: { type: Boolean, default: false },
        documentQuality: { type: Number, default: 0 },
        ocrConfidence: { type: Number, default: 0 },
        duplicateCheck: { type: Boolean, default: false },
        blacklistCheck: { type: Boolean, default: false }
    }
    
}, { 
    timestamps: true,
    collection: 'kyc_verifications'
});

KYCSchema.index({ userId: 1 });
KYCSchema.index({ 'verification.status': 1 });
KYCSchema.index({ 'aadhaarCard.extractedData.aadhaarNumber': 1 });

KYCSchema.methods.getCompletionPercentage = function() {
    let completed = 0;
    const total = 4;
    
    if (this.personalInfo.isComplete) completed++;
    if (this.bankDetails.isComplete) completed++;
    if (this.aadhaarCard.isUploaded) completed++;
    if (this.verification.isComplete) completed++;
    
    return Math.round((completed / total) * 100);
};
KYCSchema.methods.getNextStep = function() {
    if (!this.personalInfo.isComplete) {
        return {
            step: 1,
            name: 'personal_info',
            title: 'Personal Information',
            description: 'Enter your registered name, mobile number and email'
        };
    }
    
    if (!this.bankDetails.isComplete) {
        return {
            step: 2,
            name: 'bank_details',
            title: 'Bank Details',
            description: 'Provide your bank account information'
        };
    }
    
    if (!this.aadhaarCard.isUploaded) {
        return {
            step: 3,
            name: 'document_upload',
            title: 'Upload Documents',
            description: 'Upload front and back images of your Aadhaar card'
        };
    }
    
    if (this.verification.status === 'document_upload') {
        return {
            step: 4,
            name: 'processing',
            title: 'Verification in Progress',
            description: 'We are processing your documents. This may take a few minutes.'
        };
    }
    
    return {
        step: 5,
        name: 'complete',
        title: 'KYC Complete',
        description: 'Your KYC verification is complete'
    };
};

KYCSchema.pre('save', function(next) {
    // Update current step based on completion
    if (this.personalInfo.isComplete && this.bankDetails.isComplete && this.aadhaarCard.isUploaded) {
        if (this.verification.status !== 'processing' && this.verification.status !== 'verified' && this.verification.status !== 'rejected') {
            this.verification.status = 'processing';
            this.verification.currentStep = 4;
            this.verification.submittedAt = new Date();
        }
    } else if (this.aadhaarCard.isUploaded) {
        this.verification.status = 'document_upload';
        this.verification.currentStep = 3;
    } else if (this.bankDetails.isComplete) {
        this.verification.status = 'bank_details';
        this.verification.currentStep = 2;
    } else if (this.personalInfo.isComplete) {
        this.verification.status = 'personal_info';
        this.verification.currentStep = 1;
    }
    
    next();
});

module.exports = mongoose.model('KYC', KYCSchema);
 