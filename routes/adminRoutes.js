const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

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

module.exports = router;
