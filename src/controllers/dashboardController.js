const { getPrismaClient } = require('../database/connection');
const logger = require('../utils/logger');

// @desc    Obter estatísticas para o dashboard
// @route   GET /api/dashboard/stats
// @access  Private (Admin, Gestor)
const getDashboardStats = async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const user = req.user;

    let userFilter = {};
    let feedbackFilter = {};

    // Gestores veem apenas dados do seu departamento
    if (user.perfil === 'GESTOR') {
      const departmentUsers = await prisma.user.findMany({
        where: { departamento: user.departamento },
        select: { id: true }
      });
      const userIds = departmentUsers.map(u => u.id);

      userFilter = { id: { in: userIds } };
      feedbackFilter = {
        OR: [
          { avaliador_id: { in: userIds } },
          { avaliado_id: { in: userIds } }
        ]
      };
    }

    // 1. Contagem total de usuários
    const totalUsers = await prisma.user.count({ where: userFilter });

    // 2. Contagem total de feedbacks
    const totalFeedbacks = await prisma.feedback.count({ where: feedbackFilter });

    // 3. Contagem de feedbacks por tipo
    const feedbacksByType = await prisma.feedback.groupBy({
      by: ['tipo'],
      where: feedbackFilter,
      _count: {
        tipo: true
      }
    });

    // 4. Contagem de feedbacks por categoria
    const feedbacksByCategory = await prisma.feedback.groupBy({
      by: ['categoria'],
      where: feedbackFilter,
      _count: {
        categoria: true
      }
    });

    // 5. Feedbacks recentes
    const recentFeedbacks = await prisma.feedback.findMany({
      where: feedbackFilter,
      take: 5,
      orderBy: { dataFeedback: 'desc' },
      include: {
        avaliador: { select: { id: true, nome: true, foto: true } },
        avaliado: { select: { id: true, nome: true, foto: true } }
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalFeedbacks,
        feedbacksByType: feedbacksByType.map(item => ({ type: item.tipo, count: item._count.tipo })),
        feedbacksByCategory: feedbacksByCategory.map(item => ({ category: item.categoria, count: item._count.categoria })),
        recentFeedbacks
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
