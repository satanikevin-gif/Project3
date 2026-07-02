const router = require('express').Router();
const { register, login, refresh, logout, getProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
