const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/auth');

// Rota para obter os detalhes da equipe do usuário logado
// A autenticação é necessária para saber de qual usuário estamos falando
router.get('/my-team', authenticateToken, teamController.getMyTeam);


// Outras rotas de equipe (CRUD para admin/gestor) podem ser adicionadas aqui
// Exemplo:
// const { requirePermission } = require('../middleware/auth');
// router.post('/', authenticateToken, requirePermission('ADMIN'), teamController.createTeam);
// router.get('/', authenticateToken, requirePermission(['ADMIN', 'GESTOR']), teamController.getAllTeams);

module.exports = router;
