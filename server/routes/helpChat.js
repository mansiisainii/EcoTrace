const router = require('express').Router();
const { helpChat } = require('../controllers/helpChatController');
const rateLimit = require('express-rate-limit');

const helpChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // max 15 requests per window per IP
  message: {
    success: false,
    answer: "Too many help requests. Please wait before asking again."
  }
});

router.post('/', helpChatLimiter, helpChat);

module.exports = router;
