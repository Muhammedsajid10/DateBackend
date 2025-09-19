// import express from 'express'
// import { CreateMessage } from '../controllers/messageController'

// const MessageRoutes=express.Router()

// MessageRoutes.post("create-message", CreateMessage)
// export default MessageRoutes


const express = require('express');
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All message routes require authentication
router.use(verifyToken);

console.log("Message Routes Loaded");

// Send message
router.post('/send', messageController.CreateMessage);

// Get messages with a specific user
router.get('/conversation/:receiverId', messageController.GetMessages);

// Get all conversations
router.get('/conversations', messageController.getConversations);

// Mark message as read
router.put('/read/:messageId', messageController.markAsRead);

module.exports = router;

// export  default router