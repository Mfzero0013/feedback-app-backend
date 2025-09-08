const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/feedback - Criar um novo feedback
router.post('/', authenticateToken, feedbackController.createFeedback);

<<<<<<< HEAD
// GET /api/feedback - Obter feedbacks (ex: recebidos, enviados)
// Adicionar outras rotas conforme necessário
=======
// GET /api/feedback?type=... - Obter feedbacks recebidos ou enviados
router.get('/', authenticateToken, feedbackController.getFeedbacks);
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6

module.exports = router;
