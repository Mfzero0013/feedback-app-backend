require('dotenv').config();

console.log('--- SERVER STARTING - PRODUCTION VERSION ---');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

// Importa as rotas
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const teamRoutes = require('./routes/team');
const feedbackRoutes = require('./routes/feedbackRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Configuração de CORS para produção
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://feedback-app-frontend-jmdf.onrender.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middlewares essenciais
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // Usando 'combined' para produção

// Servir arquivos estáticos (se necessário)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
}

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

// Configuração da porta
const PORT = process.env.PORT || 5003;

// Rota para verificação de saúde
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota para servir o frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Iniciar o servidor
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});
