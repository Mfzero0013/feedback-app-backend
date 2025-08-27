const express = require('express');
const router = express.Router();
const { createFeedback, getFeedbacks, deleteFeedback } = require('../controllers/feedbackController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// POST /api/feedback - Criar um novo feedback
router.post('/', authenticateToken, createFeedback);

// GET /api/feedback?type=... - Obter feedbacks recebidos ou enviados
router.get('/', authenticateToken, getFeedbacks);

// DELETE /api/feedback/:id - Excluir um feedback
router.delete('/:id', authenticateToken, requirePermission('ADMINISTRADOR'), deleteFeedback);

module.exports = router;
