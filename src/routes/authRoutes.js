const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerRules,
  loginRules,
  passwordRules,
} = require('../middleware/validators');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many attempts, try again later' },
});

router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.get('/me', protect, authController.getMe);
router.put('/password', protect, passwordRules, validate, authController.changePassword);

module.exports = router;
