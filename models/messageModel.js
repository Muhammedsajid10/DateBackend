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
    fileUrl: String,
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    coinsDeducted: {
        type: Number,
        default: 1
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }
}, {
    timestamps: true
});

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const MessageModel = mongoose.model("Message", messageSchema);

module.exports = MessageModel; 
