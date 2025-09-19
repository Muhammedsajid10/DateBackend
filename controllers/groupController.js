const Group = require('../models/groupModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');

// Multer configuration for group images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/groups/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'group-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Validation schemas
const createGroupSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().min(10).max(500).required(),
    category: Joi.string().trim().min(2).max(50).required(),
    subject: Joi.string().trim().min(2).max(100).required(),
    maxMembers: Joi.number().min(2).max(500).default(100),
    isPrivate: Joi.boolean().default(false),
    requireApproval: Joi.boolean().default(false),
    allowInvites: Joi.boolean().default(true),
    allowGameCreation: Joi.boolean().default(true),
    allowVoiceCalls: Joi.boolean().default(true),
    allowFileSharing: Joi.boolean().default(true),
    tags: Joi.array().items(Joi.string().trim().max(20)).max(5),
    isLocationBased: Joi.boolean().default(false),
    city: Joi.string().when('isLocationBased', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    country: Joi.string().when('isLocationBased', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    latitude: Joi.number().when('isLocationBased', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    longitude: Joi.number().when('isLocationBased', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});

const joinGroupSchema = Joi.object({
    groupId: Joi.string().required(),
    inviteCode: Joi.string().optional(),
    message: Joi.string().max(200).optional()
});

const updateGroupSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100),
    description: Joi.string().trim().min(10).max(500),
    maxMembers: Joi.number().min(2).max(500),
    isPrivate: Joi.boolean(),
    requireApproval: Joi.boolean(),
    allowInvites: Joi.boolean(),
    allowGameCreation: Joi.boolean(),
    allowVoiceCalls: Joi.boolean(),
    allowFileSharing: Joi.boolean(),
    tags: Joi.array().items(Joi.string().trim().max(20)).max(5)
});

// Create a new group
const createGroup = async (req, res) => {
    try {
        const { error, value } = createGroupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }

        const userId = req.user.id;
        
        // Check if user has enough coins (5 coins to create a group)
        const user = await User.findById(userId);
        if (user.coins < 5) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient coins. You need 5 coins to create a group.'
            });
        }

        // Check if user already has too many groups (max 5 as creator)
        const userGroupCount = await Group.countDocuments({ 
            creator: userId, 
            isActive: true 
        });
        
        if (userGroupCount >= 5) {
            return res.status(400).json({
                success: false,
                message: 'You can only create up to 5 groups. Please delete an existing group first.'
            });
        }

        // Prepare group data
        const groupData = {
            ...value,
            creator: userId,
            admins: [userId],
            members: [{
                userId: userId,
                role: 'admin',
                joinedAt: new Date()
            }],
            settings: {
                maxMembers: value.maxMembers || 100,
                isPrivate: value.isPrivate || false,
                requireApproval: value.requireApproval || false,
                allowInvites: value.allowInvites !== false,
                allowGameCreation: value.allowGameCreation !== false,
                allowVoiceCalls: value.allowVoiceCalls !== false,
                allowFileSharing: value.allowFileSharing !== false
            }
        };

        // Handle location data
        if (value.isLocationBased && value.latitude && value.longitude) {
            groupData.location = {
                type: 'Point',
                coordinates: [value.longitude, value.latitude],
                city: value.city,
                country: value.country,
                isLocationBased: true
            };
        }

        // Create group
        const group = new Group(groupData);
        
        // Generate invite code if needed
        if (value.allowInvites) {
            group.generateInviteCode();
        }

        await group.save();

        // Deduct coins and create transaction
        user.coins -= 5;
        await user.save();

        await Transaction.create({
            userId: userId,
            type: 'deduction',
            amount: 5,
            description: 'Group creation fee',
            metadata: {
                groupId: group._id,
                groupName: group.name
            }
        });

        // Populate creator info
        await group.populate('creator', 'username profilePicture location');

        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: {
                group: group,
                remainingCoins: user.coins
            }
        });

    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create group'
        });
    }
};

// Join a group
const joinGroup = async (req, res) => {
    try {
        const { error, value } = joinGroupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }

        const userId = req.user.id;
        const { groupId, inviteCode, message } = value;

        // Find group
        let group;
        if (inviteCode) {
            group = await Group.findOne({ inviteCode, isActive: true });
        } else {
            group = await Group.findById(groupId);
        }

        if (!group || !group.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is already a member
        if (group.isMember(userId)) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this group'
            });
        }

        // Check if user is banned
        if (group.isBanned(userId)) {
            return res.status(403).json({
                success: false,
                message: 'You are banned from this group'
            });
        }

        // Check if group is full
        if (group.memberCount >= group.settings.maxMembers) {
            return res.status(400).json({
                success: false,
                message: 'Group is full'
            });
        }

        // Handle private groups and approval requirements
        if (group.settings.isPrivate && !inviteCode) {
            return res.status(403).json({
                success: false,
                message: 'This is a private group. You need an invite code to join.'
            });
        }

        if (group.settings.requireApproval && !inviteCode) {
            // Add to join requests
            const existingRequest = group.joinRequests.find(
                req => req.userId.toString() === userId && req.status === 'pending'
            );

            if (existingRequest) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a pending join request for this group'
                });
            }

            group.joinRequests.push({
                userId,
                message: message || '',
                status: 'pending'
            });

            await group.save();

            return res.status(200).json({
                success: true,
                message: 'Join request submitted. Waiting for admin approval.'
            });
        }

        // Add user as member
        group.members.push({
            userId,
            role: 'member',
            joinedAt: new Date()
        });

        group.statistics.lastActivity = new Date();
        await group.save();

        // Populate user info for response
        await group.populate('members.userId', 'username profilePicture');

        res.status(200).json({
            success: true,
            message: 'Successfully joined group',
            data: {
                group: {
                    _id: group._id,
                    name: group.name,
                    topic: group.topic,
                    memberCount: group.memberCount
                }
            }
        });

    } catch (error) {
        console.error('Join group error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join group'
        });
    }
};

// Leave a group
const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await Group.findById(groupId);
        if (!group || !group.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is a member
        if (!group.isMember(userId)) {
            return res.status(400).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Creator cannot leave their own group (must transfer ownership or delete)
        if (group.creator.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Group creator cannot leave. Please transfer ownership or delete the group.'
            });
        }

        // Remove user from members
        group.members = group.members.filter(
            member => member.userId.toString() !== userId
        );

        // Remove from admins if applicable
        group.admins = group.admins.filter(
            adminId => adminId.toString() !== userId
        );

        group.statistics.lastActivity = new Date();
        await group.save();

        res.status(200).json({
            success: true,
            message: 'Successfully left the group'
        });

    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave group'
        });
    }
};

// Get user's groups
const getUserGroups = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type = 'all' } = req.query;

        let query = {
            'members.userId': userId,
            'members.isActive': true,
            isActive: true
        };

        if (type === 'created') {
            query = { creator: userId, isActive: true };
        } else if (type === 'admin') {
            query = { 
                admins: userId, 
                creator: { $ne: userId },
                isActive: true 
            };
        }

        const groups = await Group.find(query)
            .populate('creator', 'username profilePicture')
            .populate('members.userId', 'username profilePicture')
            .sort({ 'statistics.lastActivity': -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Group.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                groups,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get user groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch groups'
        });
    }
};

// Search and discover groups
const discoverGroups = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            search, 
            category, 
            subject,
            page = 1, 
            limit = 20, 
            location,
            radius = 50 // km
        } = req.query;

        let query = {
            isActive: true,
            'settings.isPrivate': false,
            'members.userId': { $ne: userId } // Exclude groups user is already in
        };

        if (category) {
            query.category = new RegExp(category, 'i'); // Case insensitive search
        }

        if (subject) {
            query.subject = new RegExp(subject, 'i'); // Case insensitive search
        }

        if (search) {
            query.$text = { $search: search };
        }

        // Location-based search
        if (location) {
            const [lat, lng] = location.split(',').map(Number);
            if (lat && lng) {
                query.location = {
                    $geoWithin: {
                        $centerSphere: [
                            [lng, lat],
                            radius / 6371 // Convert km to radians (divide by Earth's radius)
                        ]
                    }
                };
            }
        }

        let sortCriteria = { featured: -1, 'statistics.activeMembers': -1 };
        if (search) {
            sortCriteria = { score: { $meta: 'textScore' }, ...sortCriteria };
        }

        const groups = await Group.find(query)
            .populate('creator', 'username profilePicture location')
            .sort(sortCriteria)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Group.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                groups,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Discover groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to discover groups'
        });
    }
};

// Get group details
const getGroupDetails = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await Group.findById(groupId)
            .populate('creator', 'username profilePicture location')
            .populate('admins', 'username profilePicture')
            .populate('members.userId', 'username profilePicture isOnline lastSeen')
            .populate('joinRequests.userId', 'username profilePicture');

        if (!group || !group.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user can view this group
        const isMember = group.isMember(userId);
        const isAdmin = group.isAdmin(userId);

        if (group.settings.isPrivate && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'This is a private group'
            });
        }

        // Filter sensitive data for non-members
        let responseData = group.toObject();
        
        if (!isMember) {
            delete responseData.members;
            delete responseData.joinRequests;
            delete responseData.bannedUsers;
        }

        // Only admins can see join requests and banned users
        if (!isAdmin) {
            delete responseData.joinRequests;
            delete responseData.bannedUsers;
        }

        responseData.userRole = isMember ? group.getMemberRole(userId) : null;
        responseData.isMember = isMember;
        responseData.isAdmin = isAdmin;

        res.status(200).json({
            success: true,
            data: { group: responseData }
        });

    } catch (error) {
        console.error('Get group details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get group details'
        });
    }
};

// Update group settings (admin only)
const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const { error, value } = updateGroupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => detail.message)
            });
        }

        const group = await Group.findById(groupId);
        if (!group || !group.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is admin
        if (!group.isAdmin(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only group admins can update group settings'
            });
        }

        // Update fields
        Object.keys(value).forEach(key => {
            if (key in group.settings) {
                group.settings[key] = value[key];
            } else {
                group[key] = value[key];
            }
        });

        group.updatedAt = new Date();
        await group.save();

        res.status(200).json({
            success: true,
            message: 'Group updated successfully',
            data: { group }
        });

    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update group'
        });
    }
};

// Upload group image
const uploadGroupImage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await Group.findById(groupId);
        if (!group || !group.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if user is admin
        if (!group.isAdmin(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only group admins can update group image'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        group.groupImage = `/uploads/groups/${req.file.filename}`;
        await group.save();

        res.status(200).json({
            success: true,
            message: 'Group image updated successfully',
            data: { groupImage: group.groupImage }
        });

    } catch (error) {
        console.error('Upload group image error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload group image'
        });
    }
};

// Get popular categories and subjects (for frontend suggestions)
const getPopularCategories = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        // Get most popular categories
        const categories = await Group.aggregate([
            { $match: { isActive: true } },
            { 
                $group: { 
                    _id: '$category', 
                    count: { $sum: 1 },
                    totalMembers: { $sum: '$statistics.totalMembers' }
                } 
            },
            { $sort: { count: -1, totalMembers: -1 } },
            { $limit: parseInt(limit) },
            {
                $project: {
                    category: '$_id',
                    groupCount: '$count',
                    totalMembers: '$totalMembers',
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: { categories }
        });

    } catch (error) {
        console.error('Get popular categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get popular categories'
        });
    }
};

// Get popular subjects by category
const getPopularSubjects = async (req, res) => {
    try {
        const { category, limit = 20 } = req.query;
        
        let matchQuery = { isActive: true };
        if (category) {
            matchQuery.category = new RegExp(category, 'i');
        }
        
        const subjects = await Group.aggregate([
            { $match: matchQuery },
            { 
                $group: { 
                    _id: '$subject', 
                    count: { $sum: 1 },
                    category: { $first: '$category' },
                    totalMembers: { $sum: '$statistics.totalMembers' }
                } 
            },
            { $sort: { count: -1, totalMembers: -1 } },
            { $limit: parseInt(limit) },
            {
                $project: {
                    subject: '$_id',
                    category: '$category',
                    groupCount: '$count',
                    totalMembers: '$totalMembers',
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: { subjects }
        });

    } catch (error) {
        console.error('Get popular subjects error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get popular subjects'
        });
    }
};

// Get group creation suggestions
const getGroupSuggestions = async (req, res) => {
    try {
        // Get example categories and subjects to inspire users
        const suggestions = {
            exampleCategories: [
                'Technology', 'Gaming', 'Sports', 'Music', 'Movies', 
                'Food & Cooking', 'Travel', 'Books', 'Art & Design', 
                'Fitness', 'Business', 'Education', 'Photography',
                'Language Learning', 'Dating & Relationships'
            ],
            exampleSubjects: {
                'Technology': [
                    'Web Development Discussion', 'AI & Machine Learning', 
                    'Mobile App Development', 'Cryptocurrency Chat',
                    'Tech News & Trends', 'Programming Help'
                ],
                'Gaming': [
                    'Mobile Gaming Squad', 'PC Gaming Community',
                    'Strategy Games Club', 'Indie Game Developers',
                    'Gaming News & Reviews', 'Esports Discussion'
                ],
                'Music': [
                    'Local Music Scene', 'Indie Music Discovery',
                    'Music Production Tips', 'Concert Buddies',
                    'Vinyl Record Collectors', 'Music Theory Discussion'
                ],
                'Fitness': [
                    'Home Workout Partners', 'Running Club',
                    'Nutrition & Diet Tips', 'Gym Buddies',
                    'Yoga Practice Group', 'Fitness Motivation'
                ],
                'Dating & Relationships': [
                    'Singles in [City]', 'Coffee Date Meetups',
                    'Relationship Advice', 'Speed Dating Events',
                    'Activity Partners', 'Long Distance Support'
                ]
            },
            tips: [
                'Choose a clear, descriptive category',
                'Make your subject specific and engaging',
                'Add relevant tags to help others find your group',
                'Set clear group rules and expectations',
                'Consider if you want location-based membership'
            ]
        };

        res.status(200).json({
            success: true,
            data: suggestions
        });

    } catch (error) {
        console.error('Get group suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get group suggestions'
        });
    }
};

module.exports = {
    createGroup,
    joinGroup,
    leaveGroup,
    getUserGroups,
    discoverGroups,
    getGroupDetails,
    updateGroup,
    uploadGroupImage: [upload.single('groupImage'), uploadGroupImage],
    getPopularCategories,
    getPopularSubjects,
    getGroupSuggestions
};