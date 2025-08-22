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
const feedbackRoutes = require('./routes/feedbackRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

const app = express();

// Configuração do CORS para permitir múltiplas origens
const whitelist = [
    'https://feedback-app-frontend-jmdf.onrender.com', // Frontend em produção
    'http://localhost:8080', // Exemplo para desenvolvimento local
    'http://127.0.0.1:5500' // Para Live Server do VSCode
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (como Postman ou apps mobile)
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Outros middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
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

// Middleware de tratamento de erros (deve ser o último)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
