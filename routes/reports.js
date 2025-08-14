const express = require('express');
const prisma = require('../src/lib/prisma');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/dashboard - Estatísticas para o dashboard principal
router.get('/dashboard', requirePermission('view_reports'), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalDepartments = await prisma.department.count();
    const totalFeedbacks = await prisma.feedback.count();

    const feedbackByType = await prisma.feedback.groupBy({
      by: ['tipo'],
      _count: {
        tipo: true
      }
    });

    const feedbackByStatus = await prisma.feedback.groupBy({
        by: ['status'],
        _count: {
            status: true
        }
    });

    res.json({
      totalUsers,
      totalDepartments,
      totalFeedbacks,
      feedbackByType: feedbackByType.map(item => ({ type: item.tipo, count: item._count.tipo })),
      feedbackByStatus: feedbackByStatus.map(item => ({ status: item.status, count: item._count.status }))
    });

  } catch (error) {
    console.error('Erro ao gerar relatório do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/reports/feedbacks-by-department - Relatório de feedbacks por departamento
router.get('/feedbacks-by-department', requirePermission('view_reports'), async (req, res) => {
    try {
        const feedbacksByDept = await prisma.department.findMany({
            include: {
                _count: {
                    select: { feedbacks: true }
                }
            },
            orderBy: {
                nome: 'asc'
            }
        });

        res.json(feedbacksByDept.map(dept => ({
            departmentId: dept.id,
            departmentName: dept.nome,
            feedbackCount: dept._count.feedbacks
        })));

    } catch (error) {
        console.error('Erro ao gerar relatório de feedbacks por departamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
    }
});

// GET /api/reports/user-engagement - Relatório de engajamento de usuários
router.get('/user-engagement', requirePermission('view_reports'), async (req, res) => {
    try {
        const topReceivers = await prisma.user.findMany({
            take: 10,
            orderBy: {
                feedbacksRecebidos: {
                    _count: 'desc'
                }
            },
            select: {
                id: true,
                nome: true,
                _count: {
                    select: { feedbacksRecebidos: true }
                }
            }
        });

        const topSenders = await prisma.user.findMany({
            take: 10,
            orderBy: {
                feedbacksEnviados: {
                    _count: 'desc'
                }
            },
            select: {
                id: true,
                nome: true,
                _count: {
                    select: { feedbacksEnviados: true }
                }
            }
        });

        res.json({ topReceivers, topSenders });

    } catch (error) {
        console.error('Erro ao gerar relatório de engajamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
    }
});

module.exports = router;
