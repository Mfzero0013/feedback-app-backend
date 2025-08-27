const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Proteger todas as rotas de relatórios
router.use(authenticateToken, requirePermission('ADMINISTRADOR'));

// Rota para o relatório geral
router.get('/general', reportsController.getGeneralReport);

// Rota para o relatório de engajamento
router.get('/user-engagement', reportsController.getEngagementReport);

module.exports = router;
