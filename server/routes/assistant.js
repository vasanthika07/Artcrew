const express = require('express');
const router = express.Router();
const { recommend } = require('../controllers/assistantController');

router.post('/recommend', recommend);

module.exports = router;
