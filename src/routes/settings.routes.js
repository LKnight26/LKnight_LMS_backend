const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/auth');
const {
  getSettings,
  getPublicSettings,
  updateSettings,
} = require('../controllers/settings.controller');

// Public route - get hidden pages for navbar (no auth needed)
router.get('/public', getPublicSettings);

// Admin routes
router.get('/', verifyAdmin, getSettings);
router.put('/', verifyAdmin, updateSettings);

module.exports = router;
