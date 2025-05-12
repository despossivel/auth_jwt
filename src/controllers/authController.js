const authService = require('../services/authService');

const login = async (req, res) => {
  const { username, password, mfaCode, mfaMethod } = req.body;

  try {
    const mfaDetails = (mfaCode && mfaMethod) ? { code: mfaCode, method: mfaMethod } : {};
    const token = await authService.login(username, password, mfaDetails);
    res.json({ token });
  } catch (error) {
    if (error.mfaRequired) {

      return res.status(403).json({
        message: error.message,
        mfaRequired: true,
        mfaMethodsAvailable: error.mfaMethodsAvailable || [],
      });
    }

    res.status(401).json({ message: error.message });
  }
};

module.exports = { login };