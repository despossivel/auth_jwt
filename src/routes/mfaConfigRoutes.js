const express = require('express');
const mfaConfigController = require('../controllers/mfaConfigController');
const authMiddleware = require('../middlewares/authMiddleware'); 

const router = express.Router();

router.use(authMiddleware);  

router.get('/configure', mfaConfigController.getConfiguration);
router.post('/configure/totp/initiate', mfaConfigController.initiateTotp);
router.post('/configure/totp/verify', mfaConfigController.verifyTotp);
router.post('/configure/email/enable', mfaConfigController.enableEmail);
router.post('/configure/disable', mfaConfigController.disableMethod);

module.exports = router;