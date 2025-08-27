const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { auth, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Endpoints para visualização de dados e estatísticas
 */

// Todas as rotas do dashboard requerem autenticação
router.use(auth);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Obter estatísticas gerais para o dashboard
 *     description: Retorna contagens de usuários, feedbacks e listas de itens recentes. Gestores veem apenas dados de seu departamento.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas carregadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 *       403:
 *         description: Acesso negado
 */
router.get('/stats', authorize('ADMIN', 'GESTOR'), getDashboardStats);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           description: Número total de usuários (visível ao perfil).
 *         totalFeedbacks:
 *           type: integer
 *           description: Número total de feedbacks (visível ao perfil).
 *         feedbacksByType:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               count:
 *                 type: integer
 *         feedbacksByCategory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               count:
 *                 type: integer
 *         recentFeedbacks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Feedback'
 */
