const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'audio', 'game-invite', 'call-invite', 'system'],
        default: 'text'
    },
    content: {
        type: String,
        required: function() {
            return this.messageType === 'text' || this.messageType === 'system';
        },
        maxlength: 1000
    },
    fileUrl: {
        type: String,
        required: function() {
            return ['image', 'file', 'audio'].includes(this.messageType);
        }
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    metadata: {
        gameType: String, // for game invites
        callRoomId: String, // for call invites
        systemEvent: String, // for system messages
        mentionedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupMessage',
        default: null
    },
    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        emoji: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pinnedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for better performance
groupMessageSchema.index({ groupId: 1, createdAt: -1 });
groupMessageSchema.index({ sender: 1 });
groupMessageSchema.index({ messageType: 1 });
groupMessageSchema.index({ isPinned: 1 });

// Virtual for read count
groupMessageSchema.virtual('readCount').get(function() {
    return this.readBy ? this.readBy.length : 0;
});

// Method to add reaction
groupMessageSchema.methods.addReaction = function(userId, emoji) {
    // Remove existing reaction from this user
    this.reactions = this.reactions.filter(
        reaction => reaction.userId.toString() !== userId.toString()
    );
    
    // Add new reaction
    this.reactions.push({ userId, emoji });
    return this.save();
};

// Method to remove reaction
groupMessageSchema.methods.removeReaction = function(userId) {
    this.reactions = this.reactions.filter(
        reaction => reaction.userId.toString() !== userId.toString()
    );
    return this.save();
};

// Method to mark as read
groupMessageSchema.methods.markAsRead = function(userId) {
    const existingRead = this.readBy.find(
        read => read.userId.toString() === userId.toString()
    );
    
    if (!existingRead) {
        this.readBy.push({ userId, readAt: new Date() });
        return this.save();
    }
    return Promise.resolve(this);
};

// Static method to get recent messages
groupMessageSchema.statics.getRecentMessages = function(groupId, limit = 50, before = null) {
    let query = { 
        groupId, 
        isDeleted: false 
    };
    
    if (before) {
        query.createdAt = { $lt: before };
    }
    
    return this.find(query)
        .populate('sender', 'username profilePicture isOnline')
        .populate('replyTo', 'content sender messageType')
        .populate('reactions.userId', 'username')
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method to get pinned messages
groupMessageSchema.statics.getPinnedMessages = function(groupId) {
    return this.find({ 
        groupId, 
        isPinned: true, 
        isDeleted: false 
    })
    .populate('sender', 'username profilePicture')
    .populate('pinnedBy', 'username')
    .sort({ pinnedAt: -1 });
};

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
module.exports = GroupMessage;