const { Avatar, UserAvatar } = require('../models/avatarModel');
const User = require('../models/userModel');

// Get all available avatars by category
exports.getAvatars = async (req, res) => {
    try {
        const { category } = req.query; // 'male', 'female', 'neutral' or all
        
        let query = { isActive: true };
        if (category && ['male', 'female', 'neutral'].includes(category)) {
            query.category = category;
        }
        
        const avatars = await Avatar.find(query)
            .sort({ sortOrder: 1, name: 1 })
            .select('name category imagePath thumbnailPath description tags');
        
        res.json({
            success: true,
            data: {
                avatars: avatars.map(avatar => ({
                    id: avatar._id,
                    name: avatar.name,
                    category: avatar.category,
                    image: avatar.imagePath,
                    thumbnail: avatar.thumbnailPath || avatar.imagePath,
                    description: avatar.description,
                    tags: avatar.tags
                })),
                totalCount: avatars.length,
                category: category || 'all'
            }
        });
        
    } catch (error) {
        console.error('Get avatars error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch avatars'
        });
    }
};

// Get avatars filtered by user's gender
exports.getAvatarsByUserGender = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get avatars for user's gender + neutral avatars
        const categories = [user.gender.toLowerCase(), 'neutral'];
        
        const avatars = await Avatar.find({ 
            category: { $in: categories },
            isActive: true 
        }).sort({ category: 1, sortOrder: 1, name: 1 });
        
        // Group by category
        const groupedAvatars = {
            recommended: avatars.filter(a => a.category === user.gender.toLowerCase()),
            neutral: avatars.filter(a => a.category === 'neutral')
        };
        
        res.json({
            success: true,
            data: {
                userGender: user.gender,
                categories: Object.keys(groupedAvatars).map(category => ({
                    name: category,
                    displayName: category === 'recommended' ? `${user.gender} Avatars` : 'Neutral Avatars',
                    avatars: groupedAvatars[category].map(avatar => ({
                        id: avatar._id,
                        name: avatar.name,
                        category: avatar.category,
                        image: avatar.imagePath,
                        thumbnail: avatar.thumbnailPath || avatar.imagePath,
                        description: avatar.description
                    }))
                })),
                totalCount: avatars.length
            }
        });
        
    } catch (error) {
        console.error('Get user avatars error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch avatars for user'
        });
    }
};

// Select an avatar for the user
exports.selectAvatar = async (req, res) => {
    try {
        const { avatarId, customizations } = req.body;
        
        // Validate avatar exists
        const avatar = await Avatar.findById(avatarId);
        if (!avatar || !avatar.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Avatar not found or not available'
            });
        }
        
        // Validate customizations if provided
        const validCustomizations = {};
        if (customizations) {
            if (customizations.backgroundColor && /^#[0-9A-F]{6}$/i.test(customizations.backgroundColor)) {
                validCustomizations.backgroundColor = customizations.backgroundColor;
            }
            if (customizations.borderColor && /^#[0-9A-F]{6}$/i.test(customizations.borderColor)) {
                validCustomizations.borderColor = customizations.borderColor;
            }
            if (customizations.effects && Array.isArray(customizations.effects)) {
                validCustomizations.effects = customizations.effects.filter(effect => 
                    ['glow', 'shadow', 'border', 'shine'].includes(effect)
                );
            }
        }
        
        // Update or create user avatar selection
        const userAvatar = await UserAvatar.findOneAndUpdate(
            { userId: req.user.userId },
            {
                selectedAvatar: {
                    avatarId: avatarId,
                    selectedAt: new Date(),
                    customizations: validCustomizations
                },
                isComplete: true
            },
            { 
                upsert: true, 
                new: true,
                runValidators: true
            }
        ).populate('selectedAvatar.avatarId');
        
        // Update user's avatar completion status
        await User.findByIdAndUpdate(req.user.userId, {
            'profileCompletion.avatar.isComplete': true,
            'profileCompletion.avatar.completedAt': new Date()
        });
        
        res.json({
            success: true,
            message: 'Avatar selected successfully',
            data: {
                userAvatar: {
                    userId: userAvatar.userId,
                    avatar: {
                        id: userAvatar.selectedAvatar.avatarId._id,
                        name: userAvatar.selectedAvatar.avatarId.name,
                        category: userAvatar.selectedAvatar.avatarId.category,
                        image: userAvatar.selectedAvatar.avatarId.imagePath,
                        description: userAvatar.selectedAvatar.avatarId.description
                    },
                    customizations: userAvatar.selectedAvatar.customizations,
                    selectedAt: userAvatar.selectedAvatar.selectedAt,
                    isComplete: userAvatar.isComplete
                }
            }
        });
        
    } catch (error) {
        console.error('Select avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to select avatar'
        });
    }
};

// Get user's current avatar selection
exports.getUserAvatar = async (req, res) => {
    try {
        const userAvatar = await UserAvatar.findOne({ userId: req.user.userId })
            .populate('selectedAvatar.avatarId');
        
        if (!userAvatar) {
            return res.json({
                success: true,
                data: {
                    hasAvatar: false,
                    message: 'No avatar selected yet'
                }
            });
        }
        
        const avatarDetails = await userAvatar.getAvatarDetails();
        
        res.json({
            success: true,
            data: {
                hasAvatar: true,
                userAvatar: {
                    userId: avatarDetails.userId,
                    avatar: {
                        id: avatarDetails.avatar._id,
                        name: avatarDetails.avatar.name,
                        category: avatarDetails.avatar.category,
                        image: avatarDetails.avatar.imagePath,
                        description: avatarDetails.avatar.description
                    },
                    customizations: avatarDetails.customizations,
                    selectedAt: avatarDetails.selectedAt,
                    isComplete: avatarDetails.isComplete
                }
            }
        });
        
    } catch (error) {
        console.error('Get user avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user avatar'
        });
    }
};

// Admin: Add new avatar (for seeding)
exports.addAvatar = async (req, res) => {
    try {
        const { name, category, imagePath, thumbnailPath, description, tags, sortOrder } = req.body;
        
        const avatar = new Avatar({
            name,
            category,
            imagePath,
            thumbnailPath,
            description,
            tags,
            sortOrder: sortOrder || 0,
            isActive: true
        });
        
        await avatar.save();
        
        res.status(201).json({
            success: true,
            message: 'Avatar added successfully',
            data: { avatar }
        });
        
    } catch (error) {
        console.error('Add avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add avatar'
        });
    }
};

// Seed default avatars
exports.seedAvatars = async (req, res) => {
    try {
        // Check if avatars already exist
        const existingCount = await Avatar.countDocuments();
        if (existingCount > 0) {
            return res.json({
                success: true,
                message: `${existingCount} avatars already exist. Skipping seed.`
            });
        }
        
        const defaultAvatars = [
            // Male Avatars
            { name: 'Professional Male', category: 'male', imagePath: '/avatars/male-professional.svg', sortOrder: 1, description: 'Business professional look' },
            { name: 'Casual Male', category: 'male', imagePath: '/avatars/male-casual.svg', sortOrder: 2, description: 'Relaxed casual style' },
            { name: 'Sporty Male', category: 'male', imagePath: '/avatars/male-sporty.svg', sortOrder: 3, description: 'Athletic and energetic' },
            { name: 'Creative Male', category: 'male', imagePath: '/avatars/male-creative.svg', sortOrder: 4, description: 'Artistic and creative' },
            
            // Female Avatars  
            { name: 'Professional Female', category: 'female', imagePath: '/avatars/female-professional.svg', sortOrder: 1, description: 'Business professional look' },
            { name: 'Casual Female', category: 'female', imagePath: '/avatars/female-casual.svg', sortOrder: 2, description: 'Relaxed casual style' },
            { name: 'Elegant Female', category: 'female', imagePath: '/avatars/female-elegant.svg', sortOrder: 3, description: 'Sophisticated and elegant' },
            { name: 'Creative Female', category: 'female', imagePath: '/avatars/female-creative.svg', sortOrder: 4, description: 'Artistic and creative' },
            
            // Neutral Avatars
            { name: 'Minimalist', category: 'neutral', imagePath: '/avatars/neutral-minimal.svg', sortOrder: 1, description: 'Clean and simple design' },
            { name: 'Geometric', category: 'neutral', imagePath: '/avatars/neutral-geometric.svg', sortOrder: 2, description: 'Modern geometric shapes' },
            { name: 'Abstract', category: 'neutral', imagePath: '/avatars/neutral-abstract.svg', sortOrder: 3, description: 'Abstract artistic design' }
        ];
        
        const insertedAvatars = await Avatar.insertMany(defaultAvatars);
        
        res.json({
            success: true,
            message: `Successfully seeded ${insertedAvatars.length} default avatars`,
            data: { 
                count: insertedAvatars.length,
                avatars: insertedAvatars.map(a => ({ id: a._id, name: a.name, category: a.category }))
            }
        });
        
    } catch (error) {
        console.error('Seed avatars error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed avatars'
        });
    }
};