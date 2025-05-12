const {
  validateToken
} = require('../../sdk/index');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) return res.status(403).json({ message: 'Token necessário' });

  try {
    const decoded = validateToken(token)
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

module.exports = authMiddleware;
