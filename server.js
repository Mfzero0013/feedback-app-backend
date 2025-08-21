require('dotenv').config();

console.log('--- SERVER STARTING - DEPLOY VERSION 7 ---');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Importa as rotas refatoradas
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const teamRoutes = require('./routes/team');
const feedbackRoutes = require('./routes/feedbackRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

const app = express();

// Middleware de CORS - deve ser o primeiro
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite qualquer origem
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Responde OK para requisições OPTIONS (pre-flight)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Outros middlewares
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reports', reportsRoutes);

// Rota para checar a saúde da API
app.get('/api/status', (req, res) => {
  res.send('FeedbackHub API is running!');
});

// --- Configuração para Servir o Frontend ---

// Define o caminho para a pasta de build do frontend
const frontendPath = path.join(__dirname, '..', 'html');

// Serve os arquivos estáticos do frontend
app.use(express.static(frontendPath));

// Rota catch-all: para qualquer outra requisição, serve o index.html
// Isso é crucial para Single Page Applications (SPAs) como React, Vue, etc.
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Middleware de tratamento de erros (deve ser o último)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
