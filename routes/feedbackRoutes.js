const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/feedback - Criar um novo feedback
router.post('/', authenticateToken, feedbackController.createFeedback);

// GET /api/feedback - Obter feedbacks (ex: recebidos, enviados)
// Adicionar outras rotas conforme necessário

module.exports = router;
