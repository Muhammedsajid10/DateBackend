const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    category: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true
    },
    groupImage: {
        type: String,
        default: null
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        role: {
            type: String,
            enum: ['member', 'moderator', 'admin'],
            default: 'member'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isMuted: {
            type: Boolean,
            default: false
        },
        mutedUntil: {
            type: Date,
            default: null
        },
        lastActivity: {
            type: Date,
            default: Date.now
        },
        messageCount: {
            type: Number,
            default: 0
        }
    }],
    settings: {
        maxMembers: {
            type: Number,
            default: 100,
            min: 2,
            max: 500
        },
        isPrivate: {
            type: Boolean,
            default: false
        },
        requireApproval: {
            type: Boolean,
            default: false
        },
        allowInvites: {
            type: Boolean,
            default: true
        },
        allowGameCreation: {
            type: Boolean,
            default: true
        },
        allowVoiceCalls: {
            type: Boolean,
            default: true
        },
        allowFileSharing: {
            type: Boolean,
            default: true
        },
        autoDeleteMessages: {
            type: Boolean,
            default: false
        },
        messageRetentionDays: {
            type: Number,
            default: 30,
            min: 1,
            max: 365
        }
    },
    rules: [{
        title: {
            type: String,
            required: true,
            maxlength: 100
        },
        description: {
            type: String,
            required: true,
            maxlength: 300
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    statistics: {
        totalMessages: {
            type: Number,
            default: 0
        },
        totalMembers: {
            type: Number,
            default: 0
        },
        activeMembers: {
            type: Number,
            default: 0
        },
        lastActivity: {
            type: Date,
            default: Date.now
        },
        gamesPlayed: {
            type: Number,
            default: 0
        },
        callsInitiated: {
            type: Number,
            default: 0
        }
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 20
    }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        },
        city: String,
        country: String,
        isLocationBased: {
            type: Boolean,
            default: false
        }
    },
    joinRequests: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        message: {
            type: String,
            maxlength: 200
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    }],
    bannedUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        bannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        bannedAt: {
            type: Date,
            default: Date.now
        },
        reason: {
            type: String,
            maxlength: 200
        },
        duration: {
            type: Number, // in hours, 0 = permanent
            default: 0
        }
    }],
    inviteCode: {
        type: String,
        unique: true,
        sparse: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { updatedAt: 'updatedAt' }
});

groupSchema.index({ category: 1, isActive: 1 });
groupSchema.index({ subject: 1, isActive: 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ location: '2dsphere' });
groupSchema.index({ tags: 1 });
groupSchema.index({ featured: -1, createdAt: -1 });
groupSchema.index({ name: 'text', description: 'text', category: 'text', subject: 'text', tags: 'text' });
groupSchema.virtual('memberCount').get(function() {
    return this.members ? this.members.filter(member => member.isActive).length : 0;
});

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
    return this.members.some(member => 
        member.userId.toString() === userId.toString() && member.isActive
    );
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
    return this.admins.includes(userId) || this.creator.toString() === userId.toString();
};

// Method to check if user is banned
groupSchema.methods.isBanned = function(userId) {
    const bannedUser = this.bannedUsers.find(banned => 
        banned.userId.toString() === userId.toString()
    );
    
    if (!bannedUser) return false;
    
    // Check if ban is permanent (duration = 0) or still active
    if (bannedUser.duration === 0) return true;
    
    const banExpiry = new Date(bannedUser.bannedAt.getTime() + (bannedUser.duration * 60 * 60 * 1000));
    return new Date() < banExpiry;
};

// Method to get member role
groupSchema.methods.getMemberRole = function(userId) {
    if (this.creator.toString() === userId.toString()) return 'creator';
    if (this.admins.includes(userId)) return 'admin';
    
    const member = this.members.find(member => 
        member.userId.toString() === userId.toString() && member.isActive
    );
    
    return member ? member.role : null;
};

// Method to generate invite code
groupSchema.methods.generateInviteCode = function() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.inviteCode = result;
    return result;
};

// Pre-save middleware
groupSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Update statistics
    this.statistics.totalMembers = this.members.length;
    this.statistics.activeMembers = this.members.filter(member => member.isActive).length;
    
    // Ensure creator is in admins
    if (!this.admins.includes(this.creator)) {
        this.admins.push(this.creator);
    }
    
    // Ensure creator is in members
    if (!this.isMember(this.creator)) {
        this.members.push({
            userId: this.creator,
            role: 'admin',
            joinedAt: this.createdAt || new Date()
        });
    }
    
    next();
});

// Static method to find groups by category
groupSchema.statics.findByCategory = function(category, limit = 20) {
    return this.find({ 
        category: new RegExp(category, 'i'), 
        isActive: true,
        'settings.isPrivate': false 
    })
    .populate('creator', 'username profilePicture')
    .limit(limit)
    .sort({ featured: -1, 'statistics.activeMembers': -1 });
};

// Static method to find groups by subject
groupSchema.statics.findBySubject = function(subject, limit = 20) {
    return this.find({ 
        subject: new RegExp(subject, 'i'), 
        isActive: true,
        'settings.isPrivate': false 
    })
    .populate('creator', 'username profilePicture')
    .limit(limit)
    .sort({ featured: -1, 'statistics.activeMembers': -1 });
};

// Static method to search groups
groupSchema.statics.searchGroups = function(query, filters = {}) {
    const searchQuery = {
        $text: { $search: query },
        isActive: true,
        ...filters
    };
    
    return this.find(searchQuery)
    .populate('creator', 'username profilePicture')
    .sort({ score: { $meta: 'textScore' }, featured: -1 });
};

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;