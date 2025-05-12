const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generateToken } = require('../config/jwt');

const login = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Credenciais inválidas');
  }

  const token = generateToken(user);

  return token;
};

module.exports = { login };
