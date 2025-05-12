const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');


router.post('/',authMiddleware, userController.create);

module.exports = router;