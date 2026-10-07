const express = require('express');
const router = express.Router();
const { classifyRequest, rankProvidersForRequest } = require('../controllers/aiController');

// Public or authenticated endpoints for AI assistance
router.post('/classify-request', classifyRequest);
router.post('/rank-providers', rankProvidersForRequest);

module.exports = router;
