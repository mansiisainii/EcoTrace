const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { calculate, getLogs, getSummary } = require('../controllers/emissionController');

router.post('/calculate', auth, calculate);
router.get('/logs', auth, getLogs);
router.get('/summary', auth, getSummary);

module.exports = router;
