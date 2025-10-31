// const express = require("express");
// const Message = require("../models/chatModel");

// const router = express.Router();

// // Fetch chat history between two users
// router.get("/:user1/:user2", async (req, res) => {
//   try {
//     const { user1, user2 } = req.params;
//     const messages = await Message.find({
//       $or: [
//         { sender: user1, receiver: user2 },
//         { sender: user2, receiver: user1 },
//       ],
//     }).sort("createdAt");

//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching chat history" });
//   }
// });

// module.exports = router;


// const express = require("express");
// const Message = require("../models/chatModel");

// const router = express.Router();

// // Send Message
// router.post("/send", async (req, res) => {
//     const { receiver, message } = req.body;

//     const newMessage = await Message.create({
//         sender: req.user.id,
//         receiver,
//         message
//     });

//     res.status(201).json(newMessage);
// });

// // Get Messages
// router.get("/:receiverId", async (req, res) => {
//     const messages = await Message.find({
//         $or: [
//             { sender: req.user.id, receiver: req.params.receiverId },
//             { sender: req.params.receiverId, receiver: req.user.id }
//         ]
//     }).sort({ createdAt: 1 });

//     res.json(messages);
// });

// module.exports = router;
