// import express from 'express'
// import { CreateMessage } from '../controllers/messageController'

// const MessageRoutes=express.Router()

// MessageRoutes.post("create-message", CreateMessage)
// export default MessageRoutes


const express = require('express');
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

console.log("Message Routes Loaded");

router.post('/send', messageController.CreateMessage);
router.get('/conversation/:receiverId', messageController.GetMessages);
router.get('/conversations', messageController.getConversations);
router.put('/read/:messageId', messageController.markAsRead);

module.exports = router;