# HiMate Dating App Backend

A comprehensive Node.js backend for a modern dating application with real-time features, WebRTC signaling, gaming system, and coin-based monetization.

## 🚀 Features Implemented

### ✅ Authentication System
- OTP-based mobile number authentication
- JWT token generation and validation
- Secure middleware for protected routes
- Rate limiting for security

### ✅ Profile Management
- Complete user profile CRUD operations
- Photo upload functionality (up to 5 photos)
- Location-based user search and filtering
- Advanced search with age, gender, distance filters
- Online status tracking
- Random user discovery

### ✅ Matching System
- Swipe functionality (like, dislike, superlike)
- Mutual match detection
- Potential match discovery with intelligent filtering
- Match management (view matches, unmatch)
- Coin deduction for superlikes

### ✅ Real-time Chat System
- Socket.IO based real-time messaging
- Message history with pagination
- Conversation management
- Message read receipts
- Typing indicators
- Coin deduction for messages
- File/media message support

### ✅ Voice & Video Calling
- WebRTC signaling server implementation
- Call initiation, acceptance, rejection
- ICE candidate exchange
- Call session management
- Active user tracking

### ✅ Coin-Based Payment System
- Multiple coin packages (100, 500, 1000, 2500 coins)
- Razorpay integration (test mode implemented)
- Transaction history and audit trail
- Automatic coin deduction for activities
- Reward system for engagement
- Bank account integration for withdrawals

### ✅ Gaming System
- Multiple game types (Tic-tac-toe, Rock-paper-scissors, etc.)
- Real-time multiplayer gaming with Socket.IO
- Game session management
- Player ready status tracking
- Winner rewards with coins

### ✅ Security & Performance
- Helmet.js for security headers
- CORS configuration
- Rate limiting for API endpoints
- Input validation with Joi
- MongoDB indexes for performance
- Error handling and logging

## 📁 Project Structure

```
NovoXDatingApp/
├── config/
│   └── db.js                     # MongoDB connection
├── controllers/
│   ├── authController.js         # Authentication logic
│   ├── profileController.js      # Profile management
│   ├── matchController.js        # Matching system
│   ├── messageController.js      # Chat functionality
│   ├── paymentController.js      # Payment & coins
│   ├── gameController.js         # Gaming system
│   ├── signalingController.js    # WebRTC signaling
│   └── ...
├── middleware/
│   └── auth.js                   # JWT authentication
├── models/
│   ├── userModel.js              # Enhanced user schema
│   ├── matchModel.js             # Match relationships
│   ├── messageModel.js           # Chat messages
│   ├── transactionModel.js       # Payment transactions
│   ├── gameSessionModel.js       # Gaming sessions
│   └── ...
├── routes/
│   ├── authRoutes.js             # Auth endpoints
│   ├── profileRoutes.js          # Profile endpoints
│   ├── matchRoutes.js            # Matching endpoints
│   ├── MessageRoutes.js          # Chat endpoints
│   ├── paymentRoutes.js          # Payment endpoints
│   ├── gameRoutes.js             # Gaming endpoints
│   └── ...
├── uploads/                      # Uploaded files
├── utils/
│   └── otpGenerator.js           # OTP utility
├── index.js                      # Main server file
├── package.json
└── README.md
```

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- Razorpay account (for payments)

### 1. Clone & Install
```bash
git clone <repository-url>
cd NovoXDatingApp
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Start the Server
```bash
# Development mode
npm start

# Production mode
NODE_ENV=production npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token
- `GET /api/auth/users` - Get all users (protected)

### Profile Management
- `GET /api/profile` - Get current user profile
- `PUT /api/profile/update` - Update profile information
- `POST /api/profile/upload-photos` - Upload profile pictures
- `GET /api/profile/search` - Search and filter users
- `GET /api/profile/random-online` - Get random online users
- `PUT /api/profile/online-status` - Update online status

### Matching System
- `GET /api/matches/potential` - Get potential matches
- `POST /api/matches/swipe` - Swipe on a user (like/dislike/superlike)
- `GET /api/matches` - Get user's matches
- `DELETE /api/matches/:matchId` - Unmatch a user

### Messaging
- `POST /api/messages/send` - Send a message
- `GET /api/messages/conversation/:userId` - Get conversation with user
- `GET /api/messages/conversations` - Get all conversations
- `PUT /api/messages/read/:messageId` - Mark message as read

### Payment & Coins
- `GET /api/payment/packages` - Get available coin packages
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/verify` - Verify payment and add coins
- `GET /api/payment/balance` - Get current coin balance
- `POST /api/payment/deduct` - Deduct coins for activities
- `POST /api/payment/reward` - Reward coins for engagement
- `GET /api/payment/transactions` - Get transaction history

### Gaming System
- `POST /api/games/create` - Create new game session
- `GET /api/games/available` - Get available game sessions
- `POST /api/games/join/:roomId` - Join game session
- `GET /api/games/my-games` - Get user's game sessions
- `PUT /api/games/:roomId/ready` - Update player ready status
- `POST /api/games/:roomId/end` - End game session

## 🔌 Socket.IO Events

### Chat Events
- `authenticate` - Authenticate user for socket connection
- `join-room` - Join chat room
- `send-message` - Send real-time message
- `receive-message` - Receive real-time message
- `typing` - Typing indicator
- `user-typing` - Receive typing status

### WebRTC Signaling Events
- `call-user` - Initiate voice/video call
- `incoming-call` - Receive incoming call
- `call-accepted` - Call accepted by receiver
- `call-rejected` - Call rejected by receiver
- `ice-candidate` - Exchange ICE candidates
- `end-call` - End active call

### Gaming Events
- `join-game` - Join game room
- `player-joined` - Player joined notification
- `game-move` - Send game move
- `game-ended` - Game completion notification

## 💰 Coin System

### Coin Packages
- **Basic**: 100 coins for ₹99
- **Standard**: 500 coins for ₹399
- **Premium**: 1000 coins for ₹699
- **Mega**: 2500 coins for ₹1499

### Coin Usage
- **Message**: 1 coin per message
- **Voice Call**: 2 coins per minute
- **Video Call**: 3 coins per minute
- **Superlike**: 5 coins
- **Profile Boost**: 10 coins

### Rewards
- **Daily Bonus**: 10 coins
- **Game Victory**: 10 coins
- **Engagement Reward**: 5-20 coins

## 🎮 Gaming System

### Supported Games
1. **Tic-tac-toe** - Classic 3x3 grid game
2. **Rock-paper-scissors** - Traditional hand game
3. **Word Game** - Word guessing/formation game
4. **Quiz** - Knowledge-based quiz game

### Game Flow
1. User creates game session
2. Other users can join waiting sessions
3. Players mark themselves as ready
4. Game starts when all players ready
5. Real-time moves via Socket.IO
6. Winner gets coin rewards

## 🧪 Testing

### Postman Collection
Import `HiMate_Dating_App_API.postman_collection.json` into Postman for complete API testing.

### Test Flow
1. Send OTP to mobile number
2. Verify OTP to get authentication token
3. Update user profile with details
4. Search for potential matches
5. Swipe on users to create matches
6. Send messages to matched users
7. Purchase coins and test payment flow
8. Create and join game sessions

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=80
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com
RAZORPAY_KEY_ID=your_live_razorpay_key
RAZORPAY_KEY_SECRET=your_live_razorpay_secret
```

### Deployment Steps
1. Set up production MongoDB database
2. Configure environment variables
3. Set up Razorpay live keys
4. Configure SMS service for OTP
5. Set up file storage (AWS S3 recommended)
6. Deploy to server (AWS EC2, DigitalOcean, etc.)
7. Set up domain and SSL certificate
8. Configure reverse proxy (Nginx)

## 📊 Database Models

### User Model
- Personal information (name, age, gender, bio)
- Location with geospatial indexing
- Preferences for matching
- Coin balance and premium status
- Profile pictures array
- Bank account details for withdrawals

### Match Model
- User relationships with actions
- Match status and timestamps
- Automatic match detection

### Message Model
- Chat messages with sender/receiver
- Message types (text, image, voice, video)
- Read status and timestamps
- Coin transaction references

### Transaction Model
- Complete audit trail for all coin activities
- Payment gateway integration details
- Activity-specific metadata

### Game Session Model
- Multiplayer game state management
- Player tracking and scores
- Game-specific data storage

## 🔧 Performance Optimizations

### Database
- Geospatial indexes for location queries
- Compound indexes for filtering
- Pagination for large datasets

### API
- Rate limiting to prevent abuse
- Input validation and sanitization
- Efficient query patterns

### Real-time Features
- Socket.IO connection management
- Room-based message broadcasting
- Connection cleanup on disconnect

## 🛡 Security Features

### Authentication
- JWT token-based authentication
- OTP verification for mobile numbers
- Token expiration handling

### API Security
- Helmet.js security headers
- CORS configuration
- Rate limiting per endpoint
- Input validation with Joi

### Data Protection
- Sensitive data exclusion from responses
- Password hashing (if implemented)
- SQL injection prevention

## 📈 Monitoring & Analytics

### Logging
- Server startup logging
- Error tracking and logging
- User activity logging

### Health Checks
- `/` - Server status endpoint
- `/api/status` - API health check
- Database connection monitoring

## 🔄 Future Enhancements

### Ready for Implementation
1. **Push Notifications** - Firebase integration
2. **Email Verification** - Nodemailer setup
3. **Admin Dashboard** - User management panel
4. **Advanced Matching** - ML-based recommendations
5. **Live Streaming** - WebRTC broadcasting
6. **Location Services** - GPS tracking and updates
7. **Social Features** - Stories, posts, feed
8. **Advanced Games** - More complex multiplayer games

### Payment Enhancements
1. **Multiple Payment Gateways** - Stripe, PayPal
2. **Subscription Plans** - Monthly/yearly premium
3. **Wallet System** - Cash wallet for withdrawals
4. **Referral System** - Reward-based referrals




<<<<<<< HEAD
=======


---
>>>>>>> 7bb4547980228e162230bceb309fa4088aead057

**Built with ❤️ using Node.js, Express, MongoDB, Socket.IO, and WebRTC**
