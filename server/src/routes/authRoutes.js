const { Router } = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many requests' } });

router.post('/register', limiter, [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
], validate, controller.register);

router.post('/login', limiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], validate, controller.login);

router.get('/me', auth, controller.me);

module.exports = router;
