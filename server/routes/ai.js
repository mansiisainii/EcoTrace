const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { extractEmission, getRecommendations } = require('../controllers/aiController');

router.post('/extract', auth, extractEmission);
router.get('/recommendations', auth, getRecommendations);

module.exports = router;
