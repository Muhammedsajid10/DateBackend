// import mongoose from "mongoose"
// const messageSchema=new mongoose.Schema({
//     userId:{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:"User",
//         required:true
//     },
//     message:[{

//         type:mongoose.Schema.Types.ObjectId,
//         ref:"Message",
//         required:true
//     }
// ]
// },{
//     timestamps:true
// })
// const MessageModal=mongoose.model("Message",messageSchema)
// export default MessageModal

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'voice', 'video', 'file'],
        default: 'text'
    },
    fileUrl: String, // For media messages
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    coinsDeducted: {
        type: Number,
        default: 1 // Cost per message
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }
}, {
    timestamps: true
});

// Index for efficient querying
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const MessageModel = mongoose.model("Message", messageSchema);

module.exports = MessageModel; 
