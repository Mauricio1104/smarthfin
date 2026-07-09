const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { summary, byCategory, monthly } = require('../controllers/reportController');

router.use(requireAuth);
router.get('/summary', summary);
router.get('/by-category', byCategory);
router.get('/monthly', monthly);

module.exports = router;
