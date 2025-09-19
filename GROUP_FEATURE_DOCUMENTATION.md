# 🏠 GROUP/ROOM CREATION FEATURE - API DOCUMENTATION

## 📋 Overview
Complete group/room creation system where users can create rooms with **custom categories and subjects**. Users have complete freedom to define their own topics, categories, and discussion subjects without any predefined limitations.

## 🎯 Key Features
- **Custom Categories**: Users define their own category names (e.g., "Tech Talk", "Local Events", "Study Groups")
- **Custom Subjects**: Specific subject within the category (e.g., "React Development", "Coffee Meetups", "Math Study")
- **Real-time Chat**: Instant messaging with reactions and replies
- **Member Management**: Admin controls, roles, and moderation
- **Game Integration**: Create and join games within groups
- **Voice/Video Calls**: Group calling functionality
- **Location-Based**: Optional location filtering for local groups
- **Privacy Controls**: Public, private, and approval-required groups
- **Popular Suggestions**: System suggests popular categories and subjects

---

## 🔗 API Endpoints

### 1. **Group Management**

#### `GET /api/groups/suggestions`
Get example categories, subjects, and creation tips
```json
{
  "success": true,
  "data": {
    "exampleCategories": [
      "Technology", "Gaming", "Sports", "Music", "Local Events",
      "Study Groups", "Professional Networking", "Hobby Clubs"
    ],
    "exampleSubjects": {
      "Technology": [
        "Web Development Discussion", "AI & Machine Learning",
        "Mobile App Development", "Cryptocurrency Chat"
      ],
      "Gaming": [
        "Mobile Gaming Squad", "PC Gaming Community",
        "Strategy Games Club", "Indie Game Developers"
      ]
    },
    "tips": [
      "Choose a clear, descriptive category",
      "Make your subject specific and engaging",
      "Add relevant tags to help others find your group"
    ]
  }
}
```

#### `GET /api/groups/popular-categories`
Get most popular user-created categories
```json
// Query: ?limit=20

{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "Technology",
        "groupCount": 45,
        "totalMembers": 1250
      },
      {
        "category": "Gaming",
        "groupCount": 38,
        "totalMembers": 980
      }
    ]
  }
}
```

#### `GET /api/groups/popular-subjects`
Get popular subjects, optionally filtered by category
```json
// Query: ?category=Technology&limit=20

{
  "success": true,
  "data": {
    "subjects": [
      {
        "subject": "Web Development Discussion",
        "category": "Technology",
        "groupCount": 12,
        "totalMembers": 340
      },
      {
        "subject": "AI & Machine Learning",
        "category": "Technology", 
        "groupCount": 8,
        "totalMembers": 245
      }
    ]
  }
}
```

#### `POST /api/groups/create`
Create a new group with custom category and subject (Costs 5 coins)
```json
// Request Body:
{
  "name": "React Developers NYC",
  "description": "Discuss React development, share tips, and network with local developers",
  "category": "Technology",
  "subject": "React Development",
  "maxMembers": 50,
  "isPrivate": false,
  "requireApproval": false,
  "allowGameCreation": true,
  "tags": ["react", "javascript", "frontend", "nyc"],
  "isLocationBased": true,
  "city": "New York",
  "country": "USA",
  "latitude": 40.7128,
  "longitude": -74.0060
}

// Response:
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "group": {
      "_id": "group_id",
      "name": "React Developers NYC",
      "category": "Technology",
      "subject": "React Development",
      "inviteCode": "REACT2024",
      "memberCount": 1
    },
    "remainingCoins": 95
  }
}
```

#### `GET /api/groups/discover`
Discover groups by custom categories and subjects
```json
// Query Parameters:
// ?search=react&category=Technology&subject=React Development&page=1&limit=20&location=40.7128,-74.0060&radius=50

// Response:
{
  "success": true,
  "data": {
    "groups": [
      {
        "_id": "group_id",
        "name": "React Developers NYC",
        "description": "Discuss React development and network",
        "category": "Technology",
        "subject": "React Development",
        "memberCount": 15,
        "creator": {
          "username": "johndoe",
          "profilePicture": "/uploads/profile.jpg"
        },
        "tags": ["react", "javascript", "frontend", "nyc"],
        "featured": false
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 45
    }
  }
}
```

#### `GET /api/groups/my-groups`
Get user's groups
```json
// Query Parameters:
// ?type=all|created|admin&page=1&limit=20

// Response:
{
  "success": true,
  "data": {
    "groups": [
      {
        "_id": "group_id",
        "name": "My Tech Group",
        "memberCount": 25,
        "userRole": "creator",
        "lastActivity": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

#### `GET /api/groups/:groupId`
Get group details
```json
// Response:
{
  "success": true,
  "data": {
    "group": {
      "_id": "group_id",
      "name": "Tech Enthusiasts",
      "description": "Discuss latest technology trends",
      "topic": "technology",
      "creator": {
        "username": "johndoe",
        "profilePicture": "/uploads/profile.jpg"
      },
      "members": [
        {
          "userId": {
            "_id": "user_id",
            "username": "alice",
            "profilePicture": "/uploads/alice.jpg",
            "isOnline": true
          },
          "role": "admin",
          "joinedAt": "2024-01-10T09:00:00.000Z"
        }
      ],
      "settings": {
        "maxMembers": 50,
        "isPrivate": false,
        "allowGameCreation": true,
        "allowVoiceCalls": true
      },
      "statistics": {
        "totalMessages": 1250,
        "activeMembers": 18,
        "gamesPlayed": 45
      },
      "userRole": "member",
      "isMember": true,
      "isAdmin": false
    }
  }
}
```

#### `POST /:groupId/leave`
Leave a group
```json
// Response:
{
  "success": true,
  "message": "Successfully left the group"
}
```

#### `PUT /api/groups/:groupId`
Update group settings (Admin only)
```json
// Request Body:
{
  "name": "Updated Tech Group",
  "description": "New description",
  "maxMembers": 75,
  "allowGameCreation": false
}

// Response:
{
  "success": true,
  "message": "Group updated successfully"
}
```

#### `POST /api/groups/:groupId/image`
Upload group image (Admin only)
```json
// Form Data: groupImage file

// Response:
{
  "success": true,
  "message": "Group image updated successfully",
  "data": {
    "groupImage": "/uploads/groups/group-123456789.jpg"
  }
}
```

---

## 📡 Socket.IO Events

### **Group Chat Events**

#### `join-group`
Join a group chat room
```javascript
socket.emit('join-group', {
  groupId: 'group_id',
  userId: 'user_id'
});

// Response event: 'user-joined-group'
socket.on('user-joined-group', (data) => {
  console.log(data); // { userId, username, timestamp }
});
```

#### `group-message`
Send message to group
```javascript
socket.emit('group-message', {
  groupId: 'group_id',
  message: 'Hello everyone!',
  messageType: 'text', // 'text', 'image', 'file', 'audio'
  replyTo: 'message_id', // Optional
  mentionedUsers: ['user_id1', 'user_id2'] // Optional
});

// Receive messages
socket.on('group-message-received', (data) => {
  console.log(data);
  // {
  //   messageId: 'msg_id',
  //   groupId: 'group_id',
  //   sender: { id: 'user_id', username: 'john' },
  //   message: 'Hello everyone!',
  //   messageType: 'text',
  //   timestamp: '2024-01-15T10:30:00.000Z'
  // }
});
```

#### `group-typing`
Show typing indicator
```javascript
socket.emit('group-typing', {
  groupId: 'group_id',
  isTyping: true
});

// Receive typing indicators
socket.on('group-user-typing', (data) => {
  console.log(data); // { userId, username, isTyping, timestamp }
});
```

#### `group-message-reaction`
Add/remove reactions to messages
```javascript
socket.emit('group-message-reaction', {
  groupId: 'group_id',
  messageId: 'msg_id',
  emoji: '👍',
  action: 'add' // 'add' or 'remove'
});

// Receive reaction updates
socket.on('group-message-reaction-updated', (data) => {
  console.log(data); // { messageId, userId, emoji, action, timestamp }
});
```

### **Group Activities**

#### `group-game-invite`
Invite group to play a game
```javascript
socket.emit('group-game-invite', {
  groupId: 'group_id',
  gameType: 'tic-tac-toe',
  maxPlayers: 2
});

// Receive game invites
socket.on('group-game-invite-received', (data) => {
  console.log(data);
  // {
  //   gameId: 'game_id',
  //   groupId: 'group_id',
  //   gameType: 'tic-tac-toe',
  //   creator: { id: 'user_id', username: 'john' },
  //   timestamp: '2024-01-15T10:30:00.000Z'
  // }
});
```

#### `group-call-invite`
Invite group to voice/video call
```javascript
socket.emit('group-call-invite', {
  groupId: 'group_id',
  callType: 'video' // 'audio' or 'video'
});

// Receive call invites
socket.on('group-call-invite-received', (data) => {
  console.log(data);
  // {
  //   callId: 'call_id',
  //   groupId: 'group_id',
  //   callType: 'video',
  //   creator: { id: 'user_id', username: 'john' },
  //   timestamp: '2024-01-15T10:30:00.000Z'
  // }
});
```

#### `leave-group`
Leave group chat room
```javascript
socket.emit('leave-group', {
  groupId: 'group_id',
  userId: 'user_id'
});

// Response event: 'user-left-group'
socket.on('user-left-group', (data) => {
  console.log(data); // { userId, timestamp }
});
```

---

## � **Custom Category & Subject System**

### **Complete Freedom in Group Creation:**

#### **Category Examples** (User-Defined):
- `Technology` → Subjects: "Web Development", "AI Discussion", "Mobile Apps"
- `Local Events` → Subjects: "Coffee Meetups", "Weekend Activities", "Networking Events"  
- `Study Groups` → Subjects: "Math Study", "Language Practice", "Exam Prep"
- `Professional` → Subjects: "Career Advice", "Freelancing Tips", "Industry News"
- `Hobbies` → Subjects: "Photography Tips", "Cooking Recipes", "DIY Projects"
- `Gaming` → Subjects: "Mobile Gaming", "Strategy Games", "Esports Discussion"
- `Music` → Subjects: "Local Concerts", "Music Production", "Instrument Learning"
- `Sports` → Subjects: "Running Club", "Basketball Pickup", "Fitness Motivation"

#### **Benefits of Custom System:**
✅ **No Restrictions**: Users can create any category they want  
✅ **Specific Subjects**: Detailed topics within broader categories  
✅ **Community-Driven**: Popular categories emerge naturally  
✅ **Cultural Adaptation**: Categories can reflect local interests  
✅ **Evolving Content**: New trends can create new categories  
✅ **Personal Expression**: Users express their unique interests

#### **Discovery & Suggestions:**
- **Popular Categories**: System tracks most active categories
- **Trending Subjects**: Shows what subjects are growing
- **Smart Suggestions**: Provides examples to inspire users
- **Search Flexibility**: Find groups by category, subject, or keywords

---

## 🎮 Group Topics Available → NOW REMOVED!

**IMPORTANT UPDATE**: The predefined topic system has been **completely removed**. Users now have **total freedom** to create their own categories and subjects without any limitations.

### **Old System** ❌ (Removed):
- Limited to 19 predefined topics
- Fixed categories like "dating", "gaming", "technology"  
- Users had to fit into existing topics

### **New System** ✅ (Active):
- **Unlimited custom categories** - users define their own
- **Unlimited custom subjects** - specific topics within categories
- **Community-driven content** - popular categories emerge organically
- **Complete creative freedom** - no restrictions on topic creation

---

## 💰 Pricing & Limits

- **Group Creation**: 5 coins per group
- **Maximum Groups**: 5 groups per user as creator
- **Maximum Members**: 2-500 members per group
- **Free Features**: Joining groups, messaging, reactions
- **Premium Features**: Group calls (existing coin system)

---

## 🔐 Security Features

- **Authentication Required**: All group operations require valid JWT
- **Role-Based Access**: Creator > Admin > Moderator > Member
- **Banned User Protection**: Automatic ban checking
- **Private Group Protection**: Invite codes for private groups
- **Content Moderation**: Admin controls for message management
- **Rate Limiting**: Protected against spam and abuse

---

## 📱 Frontend Integration

The group feature is now fully integrated with your existing dating app backend. All endpoints are authenticated and ready for frontend implementation. The Socket.IO events provide real-time functionality for an engaging user experience.

Your dating app now supports:
✅ **One-to-One Chat**
✅ **Group Chat & Discussions**  
✅ **Audio/Video Calls**
✅ **Group Audio/Video Calls**
✅ **Gaming System**
✅ **Topic-Based Communities**
✅ **Real-time Notifications**

🎉 **Your dating app backend is now 100% complete with all communication and social features!**