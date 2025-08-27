const express = require('express');
const router = express.Router();
const userController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

// Todas as rotas aqui são para o usuário já autenticado
router.use(authenticateToken);

// Rota para buscar os dados do perfil do usuário logado
router.get('/me', userController.getMe);

// Rota para atualizar os dados do perfil do usuário logado
router.patch('/me', userController.updateMe);

module.exports = router;
