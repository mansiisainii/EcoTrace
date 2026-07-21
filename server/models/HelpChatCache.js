const mongoose = require('mongoose');

const HelpChatCacheSchema = new mongoose.Schema({
  normalizedQuestion: {
    type: String,
    required: true,
    unique: true
  },
  answer: {
    type: String,
    required: true
  },
  hitCount: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HelpChatCache', HelpChatCacheSchema);
