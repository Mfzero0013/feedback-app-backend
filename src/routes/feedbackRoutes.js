const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateFeedback } = require('../validators/feedbackValidator');

// A partir daqui, todas as rotas são protegidas
router.use(protect);

router.route('/')
    .post(validateFeedback, feedbackController.createFeedback)
    .get(feedbackController.getAllFeedbacks);

router.route('/:id')
    .get(feedbackController.getFeedbackById)
    .patch(restrictTo('ADMINISTRADOR', 'GESTOR'), feedbackController.updateFeedbackStatus)
    .delete(restrictTo('ADMINISTRADOR'), feedbackController.deleteFeedback);

// Rota para um usuário ver os feedbacks que criou
router.get('/meus-feedbacks', feedbackController.getMySentFeedbacks);

// Rota para um usuário ver os feedbacks que recebeu
router.get('/feedbacks-recebidos', feedbackController.getMyReceivedFeedbacks);

// Rota para gestores verem feedbacks da sua equipe
router.get('/equipe', restrictTo('GESTOR'), feedbackController.getTeamFeedbacks);

module.exports = router;
