const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
    createGroup,
    joinGroup,
    leaveGroup,
    getUserGroups,
    discoverGroups,
    getGroupDetails,
    updateGroup,
    uploadGroupImage,
    getPopularCategories,
    getPopularSubjects,
    getGroupSuggestions
} = require('../controllers/groupController');

// Public routes
router.get('/suggestions', getGroupSuggestions);
router.get('/popular-categories', getPopularCategories);
router.get('/popular-subjects', getPopularSubjects);

// Protected routes (require authentication)
router.use(verifyToken);

// Group CRUD operations
router.post('/create', createGroup);
router.post('/join', joinGroup);
router.post('/:groupId/leave', leaveGroup);

// Group discovery and listing
router.get('/discover', discoverGroups);
router.get('/my-groups', getUserGroups);
router.get('/:groupId', getGroupDetails);

// Group management (admin only)
router.put('/:groupId', updateGroup);
router.post('/:groupId/image', uploadGroupImage);

module.exports = router;