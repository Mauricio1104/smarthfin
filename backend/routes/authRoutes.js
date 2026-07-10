const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { register, login, googleLogin, me } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', requireAuth, me);

module.exports = router;
