const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rota para buscar estatísticas do dashboard
// Protegida por autenticação
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

module.exports = router;
