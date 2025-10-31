const mongoose = require('mongoose');

// Avatar collection for predefined avatars
const AvatarSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { 
        type: String, 
        enum: ['male', 'female', 'neutral'], 
        required: true 
    },
    imagePath: { type: String, required: true },
    thumbnailPath: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    description: String,
    tags: [String] 
}, { 
    timestamps: true,
    collection: 'avatars'
});

// User's selected avatar
const UserAvatarSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    selectedAvatar: {
        avatarId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Avatar', 
            required: true 
        },
        selectedAt: { type: Date, default: Date.now },
        customizations: {
            backgroundColor: String,
            borderColor: String,
            effects: [String] // Like 'glow', 'shadow', etc.
        }
    },
    isComplete: { type: Boolean, default: false }
}, { 
    timestamps: true,
    collection: 'user_avatars'
});

// Indexes
AvatarSchema.index({ category: 1, isActive: 1, sortOrder: 1 });
UserAvatarSchema.index({ userId: 1 });

// Static method to get avatars by category
AvatarSchema.statics.getByCategory = function(category) {
    return this.find({ 
        category: category, 
        isActive: true 
    }).sort({ sortOrder: 1, name: 1 });
};

// Method to get user's avatar with details
UserAvatarSchema.methods.getAvatarDetails = async function() {
    await this.populate('selectedAvatar.avatarId');
    return {
        userId: this.userId,
        avatar: this.selectedAvatar.avatarId,
        customizations: this.selectedAvatar.customizations,
        selectedAt: this.selectedAvatar.selectedAt,
        isComplete: this.isComplete
    };
};

const Avatar = mongoose.model('Avatar', AvatarSchema);
const UserAvatar = mongoose.model('UserAvatar', UserAvatarSchema);

module.exports = { Avatar, UserAvatar };