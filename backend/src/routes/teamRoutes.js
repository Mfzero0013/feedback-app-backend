const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect, restrictTo } = require('../middlewares/auth');

// A partir daqui, todas as rotas são protegidas
router.use(protect);

router.route('/')
    .get(teamController.getAllTeams)
    .post(restrictTo('ADMINISTRADOR'), teamController.createTeam);

router.route('/:id')
    .get(teamController.getTeamById)
    .patch(restrictTo('ADMINISTRADOR', 'GESTOR'), teamController.updateTeam)
    .delete(restrictTo('ADMINISTRADOR'), teamController.deleteTeam);

// Rotas para gerenciar membros da equipe
router.post('/add-member', restrictTo('ADMINISTRADOR', 'GESTOR'), teamController.addMemberToTeam);
router.post('/remove-member', restrictTo('ADMINISTRADOR', 'GESTOR'), teamController.removeMemberFromTeam);

module.exports = router;
