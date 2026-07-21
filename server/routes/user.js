const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// All user profile routes require authentication
router.use(auth);

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);

router.patch('/password', userController.updatePassword);

module.exports = router;
