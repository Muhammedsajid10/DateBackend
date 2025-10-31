const express = require('express');
const { updateLanguage } = require('../controllers/languageController');
const router = express.Router();

router.put('/update', updateLanguage);

module.exports = router;