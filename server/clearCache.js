require('dotenv').config();
const mongoose = require('mongoose');
const HelpChatCache = require('./models/HelpChatCache');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await HelpChatCache.deleteMany({});
  console.log("HelpChatCache cleared!");
  process.exit(0);
});
