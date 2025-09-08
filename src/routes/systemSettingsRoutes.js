const express = require('express');
const router = express.Router();
const {
  getAllSettings,
  upsertSetting,
  getSettingByKey,
  deleteSetting
} = require('../controllers/systemSettingsController');
const { auth, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { upsertSettingSchema } = require('../validators/systemSettingsValidator');

/**
 * @swagger
 * tags:
 *   name: Configurações do Sistema
 *   description: Gerenciamento de configurações globais (somente Admin)
 */

// Todas as rotas de configurações requerem autenticação de Admin
router.use(auth, authorize('ADMIN'));

router.route('/')
  /**
   * @swagger
   * /api/settings:
   *   get:
   *     summary: Listar todas as configurações
   *     tags: [Configurações do Sistema]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de configurações
   */
  .get(getAllSettings)
  /**
   * @swagger
   * /api/settings:
   *   post:
   *     summary: Criar ou atualizar uma configuração
   *     tags: [Configurações do Sistema]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SystemSettingUpsert'
   *     responses:
   *       201:
   *         description: Configuração criada/atualizada
   */
  .post(validate(upsertSettingSchema), upsertSetting);

router.route('/:key')
  /**
   * @swagger
   * /api/settings/{key}:
   *   get:
   *     summary: Obter uma configuração pela chave
   *     tags: [Configurações do Sistema]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: key
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Dados da configuração
   *       404:
   *         description: Configuração não encontrada
   */
  .get(getSettingByKey)
  /**
   * @swagger
   * /api/settings/{key}:
   *   delete:
   *     summary: Deletar uma configuração
   *     tags: [Configurações do Sistema]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: key
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Configuração deletada
   *       404:
   *         description: Configuração não encontrada
   */
  .delete(deleteSetting);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemSettingUpsert:
 *       type: object
 *       required:
 *         - chave
 *         - valor
 *       properties:
 *         chave:
 *           type: string
 *           description: Identificador único da configuração.
 *         valor:
 *           type: string
 *           description: O valor da configuração.
 *         descricao:
 *           type: string
 *           description: Descrição opcional do que a configuração faz.
 */
