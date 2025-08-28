require('dotenv').config();

console.log('--- SERVER STARTING - DEPLOY VERSION 8 ---');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors'); // Importa o pacote cors

// Importa as rotas refatoradas
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const teamRoutes = require('./routes/team');
const feedbackRoutes = require('./routes/feedback');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Simplifica a configuração do CORS para evitar problemas de deploy
app.use(cors());

// Outros middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(morgan('dev'));

// Servir arquivos estáticos da pasta 'html'
const htmlPath = path.join(__dirname, '../html');
app.use(express.static(htmlPath));

// Rota para a página de login como página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(htmlPath, 'login.html'));
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/public', publicRoutes);

// Rota para checar a saúde da API
app.get('/api/status', (req, res) => {
  res.send('FeedbackHub API is running!');
});

// Middleware de tratamento de erros (deve ser o último)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
