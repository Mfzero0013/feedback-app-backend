const prisma = require('../config/database');
const AppError = require('../utils/AppError');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Contar feedbacks pendentes (status 'ABERTO')
    const feedbacksAbertos = await prisma.feedback.count({
      where: {
        avaliadoId: userId,
        status: 'ABERTO',
      },
    });

    // 2. Calcular a média das notas dos feedbacks recebidos
    const mediaResult = await prisma.feedback.aggregate({
      _avg: {
        score: true,
      },
      where: {
        avaliadoId: userId,
        score: {
          not: null,
        },
      },
    });
    const mediaAvaliacoes = mediaResult._avg.score || 0;

    // 3. Contar colegas de equipe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { equipeId: true },
    });

    let colegasEquipe = 0;
    if (user && user.equipeId) {
      colegasEquipe = await prisma.user.count({
        where: {
          equipeId: user.equipeId,
          id: {
            not: userId,
          },
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        feedbacksAbertos,
        mediaAvaliacoes: parseFloat(mediaAvaliacoes.toFixed(1)),
        colegasEquipe,
      },
    });
  } catch (error) {
    next(new AppError('Não foi possível buscar as estatísticas do dashboard.', 500));
  }
};
