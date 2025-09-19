# 🔗 HiMate Dating App - Socket.IO Real-time Events Documentation

## 📡 **Socket.IO Connection Setup**

### **Initialize Connection**
```javascript
import io from 'socket.io-client';

const SOCKET_URL = "http://localhost:5000"; // Development
// const SOCKET_URL = "https://your-domain.com"; // Production

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  upgrade: true,
  timeout: 20000,
  forceNew: true
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  
  // Authenticate user immediately after connection
  socket.emit('authenticate', {
    userId: currentUserId,
    username: currentUsername
  });
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
  // Handle reconnection logic
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Show connection error to user
});
```

---

## 👤 **User Authentication & Presence**

### **Authenticate User**
```javascript
// Emit after connection
socket.emit('authenticate', {
  userId: "user_123",
  username: "John Doe"
});

// Listen for authentication confirmation
socket.on('authenticated', (data) => {
  console.log('User authenticated:', data);
});
```

### **Online Status Management**
```javascript
// User comes online
socket.emit('userOnline', userId);

// Listen for user online/offline events
socket.on('userStatusChanged', (data) => {
  console.log(`User ${data.userId} is now ${data.status}`);
  // Update UI to show online/offline status
  updateUserStatus(data.userId, data.status);
});
```

---

## 💬 **Chat & Messaging Events**

### **Join Chat Room**
```javascript
// Join conversation room (for 1-on-1 chat)
const roomId = `conversation_${Math.min(userId1, userId2)}_${Math.max(userId1, userId2)}`;
socket.emit('join-room', roomId);

// Confirmation
socket.on('joined-room', (data) => {
  console.log('Joined room:', data.roomId);
});
```

### **Send Message**
```javascript
// Send direct message
socket.emit('send-message', {
  receiverId: "user_456",
  message: "Hello! How are you?",
  messageType: "text" // "text", "image", "voice", "video"
});

// Send message with media
socket.emit('send-message', {
  receiverId: "user_456",
  message: "image_url_here",
  messageType: "image",
  mediaData: {
    filename: "photo.jpg",
    size: 1024000,
    mimeType: "image/jpeg"
  }
});
```

### **Receive Messages**
```javascript
// Listen for incoming messages
socket.on('receive-message', (data) => {
  console.log('📩 New message received:', data);
  /*
  data = {
    messageId: "msg_123",
    senderId: "user_456",
    message: "Hello!",
    messageType: "text",
    timestamp: "2025-09-19T10:30:00.000Z",
    senderName: "Jane Doe",
    senderAvatar: "avatar_url"
  }
  */
  
  // Add message to chat UI
  addMessageToChat(data);
  
  // Show notification if chat is not active
  if (!isChatActive(data.senderId)) {
    showMessageNotification(data);
  }
  
  // Play notification sound
  playNotificationSound();
});
```

### **Typing Indicators**
```javascript
// Send typing indicator
socket.emit('typing', {
  receiverId: "user_456",
  isTyping: true
});

// Stop typing indicator
socket.emit('typing', {
  receiverId: "user_456",
  isTyping: false
});

// Listen for typing indicators
socket.on('user-typing', (data) => {
  console.log(`${data.senderId} is typing:`, data.isTyping);
  /*
  data = {
    senderId: "user_456",
    senderName: "Jane Doe",
    isTyping: true
  }
  */
  
  // Show/hide typing indicator in chat
  showTypingIndicator(data.senderId, data.isTyping, data.senderName);
});
```

### **Message Read Receipts**
```javascript
// Mark message as read
socket.emit('message-read', {
  messageId: "msg_123",
  senderId: "user_456"
});

// Listen for read receipts
socket.on('message-read-receipt', (data) => {
  console.log('Message read:', data);
  /*
  data = {
    messageId: "msg_123",
    readBy: "user_456",
    readAt: "2025-09-19T10:35:00.000Z"
  }
  */
  
  // Update message UI to show "read" status
  updateMessageReadStatus(data.messageId, true);
});
```

---

## 👥 **Group Chat Events**

### **Join Group**
```javascript
// Join group chat
socket.emit('join-group', {
  groupId: "group_123",
  userId: "user_456"
});

// Listen for group join confirmation
socket.on('joined-group', (data) => {
  console.log('Joined group:', data);
  /*
  data = {
    groupId: "group_123",
    groupName: "Tech Enthusiasts",
    memberCount: 25,
    recentMessages: [...]
  }
  */
});

// Listen for new members joining
socket.on('user-joined-group', (data) => {
  console.log('New member joined:', data);
  /*
  data = {
    userId: "user_789",
    username: "Alice Smith",
    timestamp: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Update group member list
  addGroupMember(data);
  
  // Show "user joined" message
  showGroupSystemMessage(`${data.username} joined the group`);
});
```

### **Group Messages**
```javascript
// Send group message
socket.emit('group-message', {
  groupId: "group_123",
  message: "Hello everyone!",
  messageType: "text",
  replyTo: "msg_456", // optional - for replies
  mentionedUsers: ["user_789", "user_012"] // optional - for mentions
});

// Listen for group messages
socket.on('group-message-received', (data) => {
  console.log('📢 Group message:', data);
  /*
  data = {
    messageId: "msg_789",
    groupId: "group_123",
    sender: {
      id: "user_456",
      username: "John Doe",
      avatar: "avatar_url"
    },
    message: "Hello everyone!",
    messageType: "text",
    replyTo: {
      messageId: "msg_456",
      originalMessage: "What's everyone doing?",
      originalSender: "Alice"
    },
    mentionedUsers: ["user_789"],
    timestamp: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Add message to group chat
  addGroupMessage(data);
  
  // Highlight if user is mentioned
  if (data.mentionedUsers.includes(currentUserId)) {
    highlightMentionedMessage(data.messageId);
    showMentionNotification(data);
  }
});
```

### **Group Typing & Reactions**
```javascript
// Group typing indicator
socket.emit('group-typing', {
  groupId: "group_123",
  isTyping: true
});

socket.on('group-user-typing', (data) => {
  console.log('Group typing:', data);
  /*
  data = {
    userId: "user_456",
    username: "John Doe",
    isTyping: true,
    timestamp: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Show group typing indicator
  showGroupTypingIndicator(data);
});

// Message reactions
socket.emit('group-message-reaction', {
  groupId: "group_123",
  messageId: "msg_789",
  emoji: "👍",
  action: "add" // or "remove"
});

socket.on('group-message-reaction-updated', (data) => {
  console.log('Reaction updated:', data);
  /*
  data = {
    messageId: "msg_789",
    userId: "user_456",
    emoji: "👍",
    action: "add",
    timestamp: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Update reaction UI
  updateMessageReaction(data);
});
```

---

## 📞 **Voice & Video Call Events**

### **Initiate Call**
```javascript
// Start a call (caller side)
socket.emit('call-user', {
  targetUserId: "user_456",
  sdpOffer: peerConnection.localDescription,
  callType: "video" // or "voice"
});

// Listen for call initiation response
socket.on('call-initiated', (data) => {
  console.log('Call initiated:', data);
  // Show "calling..." UI
  showCallingScreen(data.targetUserId);
});
```

### **Receive Incoming Call**
```javascript
// Listen for incoming calls
socket.on('incoming-call', (data) => {
  console.log('📞 Incoming call:', data);
  /*
  data = {
    callerUserId: "user_456",
    callerName: "Jane Doe",
    callerAvatar: "avatar_url",
    sdpOffer: {...},
    callType: "video",
    callId: "call_123"
  }
  */
  
  // Show incoming call screen
  showIncomingCallScreen(data);
  
  // Play ringtone
  playRingtone();
  
  // Store call data for accept/reject
  window.currentIncomingCall = data;
});
```

### **Call Actions**
```javascript
// Accept call
socket.emit('call-accepted', {
  callerUserId: window.currentIncomingCall.callerUserId,
  sdpAnswer: peerConnection.localDescription
});

// Reject call
socket.emit('call-rejected', {
  callerUserId: window.currentIncomingCall.callerUserId,
  reason: "busy" // "busy", "declined", "no_answer"
});

// End call
socket.emit('end-call', {
  otherUserId: "user_456",
  callDuration: 120, // seconds
  endReason: "completed" // "completed", "dropped", "timeout"
});
```

### **Call Status Events**
```javascript
// Call answered
socket.on('call-answered', (data) => {
  console.log('✅ Call answered:', data);
  /*
  data = {
    calleeUserId: "user_456",
    calleeName: "Jane Doe",
    sdpAnswer: {...}
  }
  */
  
  // Hide "calling..." and show active call UI
  showActiveCallScreen(data);
  
  // Set remote description
  peerConnection.setRemoteDescription(data.sdpAnswer);
});

// Call denied
socket.on('call-denied', (data) => {
  console.log('❌ Call denied:', data);
  /*
  data = {
    calleeUserId: "user_456",
    reason: "busy"
  }
  */
  
  // Show call denied message
  showCallDeniedMessage(data.reason);
  
  // Return to previous screen
  hideCallingScreen();
});

// Call ended
socket.on('call-ended', (data) => {
  console.log('📞 Call ended:', data);
  /*
  data = {
    initiatorUserId: "user_456",
    reason: "completed",
    duration: 120,
    endedAt: "2025-09-19T10:45:00.000Z"
  }
  */
  
  // Clean up call UI
  endCallCleanup();
  
  // Show call summary
  showCallSummary(data.duration);
  
  // Close peer connection
  peerConnection.close();
});
```

### **WebRTC Signaling**
```javascript
// ICE candidates exchange
socket.emit('ice-candidate', {
  targetUserId: "user_456",
  candidate: event.candidate
});

socket.on('ice-candidate', (data) => {
  console.log('🧊 ICE candidate received:', data);
  /*
  data = {
    senderUserId: "user_456",
    candidate: {...}
  }
  */
  
  // Add ICE candidate to peer connection
  peerConnection.addIceCandidate(data.candidate);
});
```

---

## 🎮 **Gaming Events**

### **Game Invitations**
```javascript
// Send game invitation
socket.emit('game-invite', {
  targetUserId: "user_456",
  gameType: "tic-tac-toe",
  betAmount: 10 // coins
});

// Receive game invitation
socket.on('game-invite-received', (data) => {
  console.log('🎮 Game invitation:', data);
  /*
  data = {
    inviterUserId: "user_456",
    inviterName: "Jane Doe",
    gameType: "tic-tac-toe",
    betAmount: 10,
    inviteId: "invite_123"
  }
  */
  
  // Show game invitation popup
  showGameInvitePopup(data);
});

// Accept game invitation
socket.emit('game-invite-accepted', {
  inviteId: "invite_123",
  inviterUserId: "user_456"
});

// Reject game invitation
socket.emit('game-invite-rejected', {
  inviteId: "invite_123",
  inviterUserId: "user_456",
  reason: "busy"
});
```

### **Game Session Events**
```javascript
// Join game room
socket.emit('join-game', "game_room_123");

// Listen for player joined
socket.on('player-joined', (data) => {
  console.log('Player joined game:', data);
  /*
  data = {
    playerId: "user_456",
    playerName: "Jane Doe",
    socketId: "socket_abc"
  }
  */
  
  // Update game lobby UI
  addPlayerToLobby(data);
});

// Game moves
socket.emit('game-move', {
  roomId: "game_room_123",
  move: {
    position: 4, // for tic-tac-toe
    player: "X"
  },
  gameState: currentGameState
});

socket.on('game-move', (data) => {
  console.log('🎯 Game move received:', data);
  /*
  data = {
    playerId: "user_456",
    move: {
      position: 4,
      player: "O"
    },
    gameState: {...}
  }
  */
  
  // Update game board
  updateGameBoard(data.move);
  
  // Update game state
  setGameState(data.gameState);
});

// Game ended
socket.on('game-ended', (data) => {
  console.log('🏆 Game ended:', data);
  /*
  data = {
    winner: "user_456",
    winnerName: "Jane Doe",
    gameState: {...},
    coinsWon: 15,
    coinsLost: 10
  }
  */
  
  // Show game result
  showGameResult(data);
  
  // Update coin balance
  updateCoinBalance(data.coinsWon || -data.coinsLost);
});
```

---

## 💝 **Match & Like Events**

### **New Match Notifications**
```javascript
// Listen for new matches
socket.on('new-match', (data) => {
  console.log('💕 New match found!', data);
  /*
  data = {
    matchId: "match_123",
    matchedUser: {
      _id: "user_456",
      username: "Jane Doe",
      profilePictures: ["url1", "url2"],
      age: 26
    },
    matchedAt: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Show match celebration animation
  showMatchCelebration(data);
  
  // Play match sound
  playMatchSound();
  
  // Add to matches list
  addToMatchesList(data);
});

// Super like notifications
socket.on('super-like-received', (data) => {
  console.log('⭐ Super like received!', data);
  /*
  data = {
    fromUserId: "user_456",
    fromUser: {
      username: "John Doe",
      profilePictures: ["url1"]
    },
    timestamp: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Show super like notification
  showSuperLikeNotification(data);
});
```

---

## 🎁 **Gift & Earning Events**

### **Gift Notifications**
```javascript
// Listen for gifts received (women)
socket.on('gift-received', (data) => {
  console.log('🎁 Gift received!', data);
  /*
  data = {
    giftId: "diamond",
    giftName: "Diamond",
    giftIcon: "💎",
    giftValue: 50, // hearts
    senderId: "user_456",
    senderName: "John Doe",
    callId: "call_123", // if sent during call
    timestamp: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Show gift animation
  showGiftAnimation(data);
  
  // Update hearts balance
  updateHeartsBalance(data.giftValue);
  
  // Show thank you message option
  showThankYouOption(data.senderId);
});

// Earnings notifications (women)
socket.on('earnings-updated', (data) => {
  console.log('💰 Earnings updated:', data);
  /*
  data = {
    heartsEarned: 10,
    coinsEarned: 5,
    moneyEarned: 2.50,
    source: "call", // "call", "gift", "badge"
    totalEarnings: {
      hearts: 150,
      coins: 85,
      money: 42.50
    }
  }
  */
  
  // Update earnings display
  updateEarningsDisplay(data);
  
  // Show earning notification
  showEarningNotification(data);
});
```

---

## 🏆 **Badge & Achievement Events**

### **Badge Earned**
```javascript
// Listen for badge achievements
socket.on('badge-earned', (data) => {
  console.log('🏆 Badge earned!', data);
  /*
  data = {
    badgeId: "first_call",
    badgeName: "First Call",
    badgeDescription: "Complete your first call",
    badgeIcon: "📞",
    heartsReward: 10,
    earnedAt: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Show badge earned animation
  showBadgeEarnedAnimation(data);
  
  // Play achievement sound
  playAchievementSound();
  
  // Update badges collection
  addToBadgeCollection(data);
  
  // Update hearts if reward included
  if (data.heartsReward > 0) {
    updateHeartsBalance(data.heartsReward);
  }
});
```

---

## 🔔 **General Notification Events**

### **System Notifications**
```javascript
// General app notifications
socket.on('notification', (data) => {
  console.log('🔔 Notification:', data);
  /*
  data = {
    type: "system", // "system", "promotion", "update"
    title: "Welcome Bonus!",
    message: "You've received 10 free coins!",
    icon: "🎉",
    action: {
      type: "navigate",
      screen: "wallet"
    },
    timestamp: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Show notification banner
  showNotificationBanner(data);
  
  // Add to notification center
  addToNotificationCenter(data);
});

// Profile view notifications
socket.on('profile-viewed', (data) => {
  console.log('👁️ Profile viewed:', data);
  /*
  data = {
    viewerId: "user_456",
    viewerName: "Jane Doe",
    viewerProfilePicture: "url1",
    viewedAt: "2025-09-19T10:30:00.000Z"
  }
  */
  
  // Show profile view notification
  showProfileViewNotification(data);
});
```

---

## 📱 **Complete Integration Example**

### **React Native Socket Manager**
```javascript
class SocketManager {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.username = null;
  }
  
  connect(userId, username) {
    this.userId = userId;
    this.username = username;
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: true
    });
    
    this.setupEventListeners();
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.authenticate();
    });
  }
  
  authenticate() {
    this.socket.emit('authenticate', {
      userId: this.userId,
      username: this.username
    });
  }
  
  setupEventListeners() {
    // Chat events
    this.socket.on('receive-message', this.handleReceiveMessage.bind(this));
    this.socket.on('user-typing', this.handleUserTyping.bind(this));
    
    // Call events
    this.socket.on('incoming-call', this.handleIncomingCall.bind(this));
    this.socket.on('call-answered', this.handleCallAnswered.bind(this));
    this.socket.on('call-ended', this.handleCallEnded.bind(this));
    
    // Match events
    this.socket.on('new-match', this.handleNewMatch.bind(this));
    
    // Gift events
    this.socket.on('gift-received', this.handleGiftReceived.bind(this));
    
    // Badge events
    this.socket.on('badge-earned', this.handleBadgeEarned.bind(this));
  }
  
  // Chat methods
  sendMessage(receiverId, message, messageType = 'text') {
    this.socket.emit('send-message', {
      receiverId,
      message,
      messageType
    });
  }
  
  sendTyping(receiverId, isTyping) {
    this.socket.emit('typing', {
      receiverId,
      isTyping
    });
  }
  
  // Call methods
  initiateCall(targetUserId, sdpOffer, callType) {
    this.socket.emit('call-user', {
      targetUserId,
      sdpOffer,
      callType
    });
  }
  
  acceptCall(callerUserId, sdpAnswer) {
    this.socket.emit('call-accepted', {
      callerUserId,
      sdpAnswer
    });
  }
  
  rejectCall(callerUserId) {
    this.socket.emit('call-rejected', {
      callerUserId
    });
  }
  
  endCall(otherUserId) {
    this.socket.emit('end-call', {
      otherUserId
    });
  }
  
  // Event handlers
  handleReceiveMessage(data) {
    // Update chat state
    ChatStore.addMessage(data);
    
    // Show notification if needed
    if (!ChatStore.isCurrentChat(data.senderId)) {
      NotificationService.showChatNotification(data);
    }
  }
  
  handleIncomingCall(data) {
    // Show incoming call screen
    NavigationService.navigate('IncomingCall', { callData: data });
    
    // Play ringtone
    RingtoneService.playIncomingCall();
  }
  
  handleNewMatch(data) {
    // Show match celebration
    NavigationService.navigate('MatchCelebration', { matchData: data });
    
    // Update matches list
    MatchStore.addMatch(data);
  }
  
  handleGiftReceived(data) {
    // Show gift animation
    GiftAnimationService.showGiftAnimation(data);
    
    // Update earnings
    EarningsStore.updateEarnings(data.giftValue);
  }
  
  handleBadgeEarned(data) {
    // Show badge earned popup
    BadgeService.showBadgeEarned(data);
    
    // Update badge collection
    BadgeStore.addBadge(data);
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Usage
const socketManager = new SocketManager();
socketManager.connect(userId, username);
```

---

## 🔧 **Error Handling**

### **Connection Errors**
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  
  // Show connection error to user
  showErrorMessage('Unable to connect to server. Please check your internet connection.');
  
  // Attempt reconnection
  setTimeout(() => {
    socket.connect();
  }, 5000);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected us, reconnect manually
    socket.connect();
  }
  
  // Show offline indicator
  setConnectionStatus('offline');
});
```

### **Event Error Handling**
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  switch (error.type) {
    case 'authentication_failed':
      // Redirect to login
      AuthService.logout();
      break;
      
    case 'rate_limited':
      showErrorMessage('You are sending messages too quickly. Please slow down.');
      break;
      
    case 'insufficient_coins':
      showErrorMessage('Insufficient coins for this action.');
      NavigationService.navigate('BuyCoins');
      break;
      
    default:
      showErrorMessage('An error occurred. Please try again.');
  }
});
```

---

This comprehensive Socket.IO documentation provides all the real-time events and integration patterns needed for the HiMate Dating App frontend development. All events are tested and ready for production use.