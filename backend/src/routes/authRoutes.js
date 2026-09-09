const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { authenticate } = require('../middleware/auth');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
