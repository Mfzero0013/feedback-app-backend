const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Todas as rotas de admin requerem autenticação
router.use(authenticateToken);

// Rotas para gerenciar Usuários
// GESTOR pode listar usuários para selecionar um gestor para a nova equipe
router.get('/manage-users', requirePermission(['ADMINISTRADOR', 'GESTOR']), adminController.getAllUsers);
router.post('/users', requirePermission('ADMINISTRADOR'), adminController.createUser);
router.put('/users/:id', requirePermission('ADMINISTRADOR'), adminController.updateUser);
router.delete('/users/:id', requirePermission('ADMINISTRADOR'), adminController.deleteUser);

// Rotas para gerenciar Equipes
router.get('/manage-teams', requirePermission('ADMINISTRADOR'), adminController.getAllTeams);
// GESTOR pode criar equipes
router.post('/teams', requirePermission(['ADMINISTRADOR', 'GESTOR']), adminController.createTeam);
router.put('/teams/:id', requirePermission('ADMINISTRADOR'), adminController.updateTeam);
router.delete('/teams/:id', requirePermission('ADMINISTRADOR'), adminController.deleteTeam);

module.exports = router;
