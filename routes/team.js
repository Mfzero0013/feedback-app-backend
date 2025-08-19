const express = require('express');
const router = express.Router();
const { getMyTeam } = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/teams/my-team
// @desc    Get the logged-in user's team and members
// @access  Private
router.get('/my-team', authenticateToken, getMyTeam);

module.exports = router;
