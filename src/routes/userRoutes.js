const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', userController.listAvailable);

module.exports = router;
