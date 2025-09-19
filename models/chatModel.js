// const mongoose = require("mongoose");

// const ChatSchema = new mongoose.Schema(
//   {
//     sender: { type: String, required: true },
//     receiver: { type: String, required: true },
//     message: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Message", ChatSchema);


// import mongoose  from "mongoose";

// const ChatSchema = new mongoose.Schema({
//     members:[
//         {
//          type:mongoose.Schema.Types.ObjectId,
//          ref:"User",
//          required:true
//         }
// ],
// message:[
//     {
//     type:mongoose.Schema.Types.ObjectId,
//     ref:'Message',
//     required :true
//     }
// ]
// } ,{
//     timestamps:true
// });
// const chatModel=mongoose.model("Chat", ChatSchema)

// export default chatModel



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
