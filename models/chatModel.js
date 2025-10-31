const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            required: true
        }
    ]
}, {
    timestamps: true    
});

const chatModel = mongoose.model("Chat", ChatSchema);

module.exports = chatModel;
