require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Importa as rotas refatoradas
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const teamsRoutes = require('./routes/teams');
const feedbackRoutes = require('./routes/feedback');
const reportsRoutes = require('./routes/reports');

const app = express();

// Middlewares essenciais
// Configuração de CORS para depuração - reflete a origem
app.use(cors({ origin: true, credentials: true }));
app.use(helmet()); // Adiciona cabeçalhos de segurança
app.use(compression()); // Comprime as respostas
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições
app.use(morgan('dev')); // Loga as requisições HTTP no console

// Define as rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportsRoutes);

// Rota de health check
app.get('/', (req, res) => {
  res.send('FeedbackHub API is running!');
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
