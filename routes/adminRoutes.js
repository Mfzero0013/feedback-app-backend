const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

<<<<<<< HEAD
// Middleware para garantir que apenas administradores acessem estas rotas
router.use(authenticateToken);
router.use(requirePermission('ADMINISTRADOR'));

// Rotas para gerenciar Usuários
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Rotas para gerenciar Equipes
router.get('/teams', adminController.getAllTeams);
router.post('/teams', adminController.createTeam);
router.put('/teams/:id', adminController.updateTeam);
router.delete('/teams/:id', adminController.deleteTeam);
=======
// Todas as rotas de admin requerem autenticação
router.use(authenticateToken);

// Rota para buscar gestores
router.get('/managers', requirePermission(['ADMINISTRADOR', 'GESTOR']), adminController.getManagers);

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
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6

module.exports = router;
