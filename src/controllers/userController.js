const User = require('../models/user');
const bcrypt = require('bcryptjs');


const create = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(500).json({ message: 'voce nao é admin', error: err.message });

  const { username, password, role, email } = req.body;

  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).json({ message: 'Usuário já existe' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ username, password: hashedPassword, role, email });

  try {
    await user.save();
    res.status(201).json({ message: 'Usuário criado com sucesso', user });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar usuário', error: err.message });
  }
};

module.exports = { create };