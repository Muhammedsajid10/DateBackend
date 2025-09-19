const express = require('express');
const multer = require('multer');
const path = require('path');
const { 
    submitPersonalInfo, 
    submitBankDetails, 
    uploadAadhaarCard, 
    getKYCStatus,
    checkVerificationStatus 
} = require('../controllers/kycController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for document uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/kyc-documents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'aadhaar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only one file at a time
    }
});

console.log("Enhanced KYC Routes Loaded");

// Apply authentication middleware to all routes
router.use(verifyToken);

// Step 1: Submit Personal Information
router.post('/personal-info', submitPersonalInfo);

// Step 2: Submit Bank Details  
router.post('/bank-details', submitBankDetails);

// Step 3: Upload Aadhaar Card (front/back)
router.post('/upload-aadhaar', upload.single('document'), uploadAadhaarCard);

// Get KYC Status and Progress
router.get('/status', getKYCStatus);

// Check verification status (for polling)
router.get('/verification-status', checkVerificationStatus);

module.exports = router;
