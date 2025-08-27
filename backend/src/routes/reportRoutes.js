const express = require('express');
const router = express.Router();
const { generateReport, getAllReports } = require('../controllers/reportController');
const { auth, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { generateReportSchema } = require('../validators/reportValidators');

/**
 * @swagger
 * tags:
 *   name: Relatórios
 *   description: Geração e consulta de relatórios
 */

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Gerar um novo relatório
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateReport'
 *     responses:
 *       201:
 *         description: Relatório gerado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado
 */
router.post('/', auth, authorize('ADMIN', 'GESTOR'), validate(generateReportSchema), generateReport);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Listar todos os relatórios gerados
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de relatórios
 *       403:
 *         description: Acesso negado
 */
router.get('/', auth, authorize('ADMIN', 'GESTOR'), getAllReports);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     GenerateReport:
 *       type: object
 *       required:
 *         - title
 *         - type
 *       properties:
 *         title:
 *           type: string
 *           description: Título do relatório
 *           example: "Resumo de Feedbacks - Q1 2024"
 *         type:
 *           type: string
 *           description: Tipo do relatório
 *           enum: [FEEDBACK_SUMMARY, USER_ENGAGEMENT]
 *           example: FEEDBACK_SUMMARY
 *         filters:
 *           type: object
 *           properties:
 *             departamento:
 *               type: string
 *               description: Filtrar por um departamento específico
 *               example: "Vendas"
 *             startDate:
 *               type: string
 *               format: date-time
 *               description: Data de início para o filtro
 *               example: "2024-01-01T00:00:00.000Z"
 *             endDate:
 *               type: string
 *               format: date-time
 *               description: Data de fim para o filtro
 *               example: "2024-03-31T23:59:59.999Z"
 */
