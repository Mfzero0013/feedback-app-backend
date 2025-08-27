const express = require('express');
const prisma = require('../config/database'); // Caminho corrigido
const { authenticateToken, requirePermission } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

// Middleware de autenticação para todas as rotas de relatório
router.use(authenticateToken);

// GET /api/reports/general - Estatísticas gerais para o admin
router.get('/general', requirePermission('ADMIN'), async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalEquipes = await prisma.equipe.count(); // Modelo corrigido
    const totalFeedbacks = await prisma.feedback.count();

    const feedbackByStatus = await prisma.feedback.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalEquipes,
        totalFeedbacks,
        feedbackByStatus: feedbackByStatus.map(item => ({ status: item.status, count: item._count.status })),
      },
    });
  } catch (error) {
    next(new AppError('Erro ao gerar relatório geral.', 500));
  }
});

// GET /api/reports/user-engagement - Relatório de engajamento de usuários
router.get('/user-engagement', requirePermission('ADMIN'), async (req, res, next) => {
  try {
    const topReceivers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        RecebidosPeloUsuario: { _count: 'desc' }, // Relação corrigida
      },
      select: {
        id: true,
        nome: true,
        _count: {
          select: { RecebidosPeloUsuario: true },
        },
      },
    });

    const topSenders = await prisma.user.findMany({
      take: 10,
      orderBy: {
        CriadosPeloUsuario: { _count: 'desc' }, // Relação corrigida
      },
      select: {
        id: true,
        nome: true,
        _count: {
          select: { CriadosPeloUsuario: true },
        },
      },
    });

    res.status(200).json({
        status: 'success',
        data: { topReceivers, topSenders },
    });

  } catch (error) {
    next(new AppError('Erro ao gerar relatório de engajamento.', 500));
  }
});

module.exports = router;
