const express = require('express');
const router = express.Router();
const {
  getAllFeedbackTypes,
  createFeedbackType,
  updateFeedbackType,
  deleteFeedbackType,
} = require('../controllers/feedbackTypeController');
const { auth, authorize } = require('../middlewares/auth');

// Proteger todas as rotas abaixo: requer autenticação e cargo de ADMINISTRADOR
router.use(auth, authorize('ADMINISTRADOR'));

// Rotas para o CRUD de Tipos de Feedback
router.route('/')
  .get(getAllFeedbackTypes)
  .post(createFeedbackType);

router.route('/:id')
  .put(updateFeedbackType)
  .delete(deleteFeedbackType);

module.exports = router;
