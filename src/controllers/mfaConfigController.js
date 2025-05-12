const mfaConfigService = require('../services/mfaConfigService');

const getConfiguration = async (req, res) => {
  try {
    const config = await mfaConfigService.getMfaConfiguration(req.user.id);
    res.json(config);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const initiateTotp = async (req, res) => {
  try {
    const result = await mfaConfigService.initiateTotpSetup(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const verifyTotp = async (req, res) => {
  const { totpCode, tempSecret } = req.body;
  try {
    const result = await mfaConfigService.verifyAndEnableTotp(req.user.id, totpCode, tempSecret);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const enableEmail = async (req, res) => {
  try {
    const result = await mfaConfigService.enableEmailMfa(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const disableMethod = async (req, res) => {
  const { method } = req.body; 
  try {
    const result = await mfaConfigService.disableMfaMethod(req.user.id, method);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getConfiguration,
  initiateTotp,
  verifyTotp,
  enableEmail,
  disableMethod,
};