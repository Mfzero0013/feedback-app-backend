const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const expressRateLimit = require('express-rate-limit');
const path = require('path');
const { getPrismaClient, disconnectPrisma } = require('./database/connection');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const swaggerSetup = require('./utils/swagger');

// Carregar variáveis de ambiente
dotenv.config();

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const systemSettingsRoutes = require('./routes/systemSettingsRoutes');
const teamRoutes = require('./routes/teamRoutes');
const feedbackTypeRoutes = require('./routes/feedbackTypeRoutes');

const app = express();

// Conectar ao banco de dados
const prisma = getPrismaClient();

// Middlewares de segurança e utilitários
app.use(cors()); // Habilita CORS para todas as origens
app.use(helmet()); // Adiciona cabeçalhos de segurança
app.use(express.json()); // Habilita o parsing de JSON no corpo da requisição
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (fotos de perfil)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate Limiter para prevenir ataques de força bruta
const limiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Configurar Swagger
swaggerSetup(app);

// Montar rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', systemSettingsRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/feedback-types', feedbackTypeRoutes);

// Rota de Health Check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Servidor funcionando corretamente!' });
});

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
