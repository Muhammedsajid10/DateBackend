// const express = require('express');
// const { processVoice, uploadAudio } = require('../controllers/voiceController');
// const router = express.Router();

// router.post('/test', uploadAudio, processVoice);

// module.exports = router;








// const express = require('express');
// const { processVoice } = require('../controllers/voiceController');
// const router = express.Router();

// router.post('/test', processVoice);

// module.exports = router;





const express = require('express');
const { processVoice, uploadAudio } = require('../controllers/voiceController');
const router = express.Router();

router.post('/test', uploadAudio, processVoice);

module.exports = router;
