const express = require('express');
const { registerUser, loginUser, forgotPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', registerUser);
router.post('/loginpage', loginUser);
router.post('/forgot-password', forgotPassword);

module.exports = router;
