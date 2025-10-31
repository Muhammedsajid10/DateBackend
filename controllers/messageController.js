// import chatModel from "../models/chatModel";
// import MessageModal from "../models/messageModel";

// export const CreateMessage=async(req,res)=>{
//     try {
//         const {senderId, receiverId, message}=req.body
//         if(!senderId || !receicerId || !message){
//             return res.status(400).json({
//                 success:false,
//                 message:`${senderId ? "Sender Id": !receiverId ? "Receiver Id": "Message"} is required.`,
//             });
//         }
//         const newMessage=new MessageModal({
//             userId:senderId, 
//             message
//         })
//         const savemessage= await newMessage.save()
//         let chat=await chatModel.findOne({
//             members:{
//                 $all:[senderId, receiverId],
//                 $size: 2
//             }
//         })
//         if (chat){
//             chat=await chatModel.findByIdAndUpdate(chat._id,{
//                 $push:{
//                     message:savemessage._id
//                 }
//             },{new:true})
//         }else{
//             chat =new chatModel({
//                 members:[senderId, receiverId],
//                 messages:[savemessage._id]
//             })
//             await chat.save()
//         }
//         return res.status(200).json({
//             success:true,
//             message:"Message sent successfully",
//             data:{
//                 newMessage: savemessage,
//                 chat:chat,
//             },
//         })
//     } catch (error) {
//         console.log("error")
//         res.status(500).json({
//             success:false,
//             message:"Internal server error"
//         })
//     }
// }




const mongoose = require('mongoose');
const chatModel = require("../models/chatModel");
const MessageModel = require("../models/messageModel");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const joi = require('joi');

exports.CreateMessage = async (req, res) => {
    try {
        const schema = joi.object({
            receiverId: joi.string().required(),
            content: joi.string().required().trim(),
            messageType: joi.string().valid('text', 'image', 'voice', 'video', 'file').default('text'),
            fileUrl: joi.string()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { receiverId, content, messageType, fileUrl } = req.body;
        const senderId = req.user._id;

        // Check if receiverId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiverId format. Please provide a valid user ID."
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found'
            });
        }

        // Check if sender has enough coins (1 coin per message)
        const sender = await User.findById(senderId);
        if (sender.coins < 1) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient coins to send message'
            });
        }

        // Deduct coin from sender
        await User.findByIdAndUpdate(senderId, { $inc: { coins: -1 } });

        // Create message
        const newMessage = new MessageModel({
            sender: senderId,
            receiver: receiverId,
            content,
            messageType,
            fileUrl,
            coinsDeducted: 1
        });

        const savedMessage = await newMessage.save();

        // Create transaction record
        const transaction = await Transaction.create({
            userId: senderId,
            type: 'deduction',
            purpose: 'message_send',
            amount: 1,
            balanceBefore: sender.coins,
            balanceAfter: sender.coins - 1,
            activityDetails: {
                targetUserId: receiverId,
                messageId: savedMessage._id
            }
        });

        // Update transaction reference in message
        savedMessage.transactionId = transaction._id;
        await savedMessage.save();

        // Find or create chat
        let chat = await chatModel.findOne({
            members: { $all: [senderId, receiverId] }
        });

        if (chat) {
            chat.messages.push(savedMessage._id);
            await chat.save();
        } else {
            chat = new chatModel({
                members: [senderId, receiverId],
                messages: [savedMessage._id]
            });
            await chat.save();
        }

        // Populate sender info for response
        await savedMessage.populate('sender', 'username profilePictures');

        return res.status(200).json({
            success: true,
            data: {
                message: savedMessage,
                chatId: chat._id,
                coinsRemaining: sender.coins - 1
            },
            message: "Message sent successfully"
        });

    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get conversation messages
exports.GetMessages = async (req, res) => {
    try {
        const schema = joi.object({
            receiverId: joi.string().required(),
            page: joi.number().min(1).default(1),
            limit: joi.number().min(1).max(50).default(20)
        });

        const { error, value } = schema.validate({
            ...req.query,
            receiverId: req.params.receiverId
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { receiverId, page, limit } = value;
        const senderId = req.user._id;
        const skip = (page - 1) * limit;
        
        // Check if receiverId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiverId format. Please provide a valid user ID."
            });
        }

        // Find messages between sender and receiver
        const messages = await MessageModel.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        })
        .populate('sender', 'username profilePictures')
        .populate('receiver', 'username profilePictures')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const total = await MessageModel.countDocuments({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        // Mark messages as read
        await MessageModel.updateMany(
            { sender: receiverId, receiver: senderId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        return res.status(200).json({
            success: true,
            data: messages.reverse(), // Return in chronological order
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            message: "Messages retrieved successfully"
        });

    } catch (error) {
        console.error('Get messages error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get user's conversations
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const conversations = await chatModel.find({
            members: userId
        })
        .populate('members', 'username profilePictures isOnline lastSeen')
        .populate({
            path: 'messages',
            options: { limit: 1, sort: { createdAt: -1 } },
            populate: {
                path: 'sender receiver',
                select: 'username'
            }
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

        const formattedConversations = conversations.map(chat => {
            const otherMember = chat.members.find(member => 
                member._id.toString() !== userId.toString()
            );
            const lastMessage = chat.messages[0] || null;

            return {
                chatId: chat._id,
                user: otherMember,
                lastMessage,
                updatedAt: chat.updatedAt
            };
        });

        const total = await chatModel.countDocuments({ members: userId });

        res.status(200).json({
            success: true,
            data: formattedConversations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            message: 'Conversations retrieved successfully'
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        
        // Check if messageId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID format. Please provide a valid message ID.'
            });
        }

        const message = await MessageModel.findOneAndUpdate(
            { 
                _id: messageId, 
                receiver: userId, 
                isRead: false 
            },
            { 
                isRead: true, 
                readAt: new Date() 
            },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or already read'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message marked as read'
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    CreateMessage: exports.CreateMessage,
    GetMessages: exports.GetMessages,
    getConversations: exports.getConversations,
    markAsRead: exports.markAsRead
};

