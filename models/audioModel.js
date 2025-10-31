const mongoose = require('mongoose');

const AudioSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  audioData: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Audio', AudioSchema);