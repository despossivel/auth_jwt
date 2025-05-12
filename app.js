const express = require('express');
const authMiddleware = require('./src/middlewares/authMiddleware');
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');

const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors());

app.use(bodyParser.json());
app.use(errorMiddleware);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.get('/protected', authMiddleware, (req, res) => res.json({
  message: 'Acesso autorizado',
  user: req.user,
}));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
