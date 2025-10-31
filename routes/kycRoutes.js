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
        fileSize: 10 * 1024 * 1024,
        files: 1
    }
});

console.log("Enhanced KYC Routes Loaded");

router.use(verifyToken);

router.post('/personal-info', submitPersonalInfo);
router.post('/bank-details', submitBankDetails);
router.post('/upload-aadhaar', upload.single('document'), uploadAadhaarCard);
router.get('/status', getKYCStatus);
router.get('/verification-status', checkVerificationStatus);

module.exports = router;
