const express = require('express');
const router = express.Router();
const { getAllTeams } = require('../controllers/publicController');

// @route   GET /api/public/teams
// @desc    Busca todas as equipes para uso público
// @access  Public
router.get('/teams', getAllTeams);

module.exports = router;
