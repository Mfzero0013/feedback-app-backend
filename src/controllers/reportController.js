const { getPrismaClient } = require('../database/connection');
const logger = require('../utils/logger');

// @desc    Gerar um novo relatório
// @route   POST /api/reports
// @access  Private (Admin, Gestor)
const generateReport = async (req, res, next) => {
  try {
    const { title, type, filters } = req.body;
    const userId = req.user.id;
    const userProfile = req.user.perfil;
    const userDepartment = req.user.departamento;
    const prisma = getPrismaClient();

    let reportData = {};
    let queryFilters = {};

    // Gestores só podem gerar relatórios para seu próprio departamento
    if (userProfile === 'GESTOR') {
      if (filters && filters.departamento && filters.departamento !== userDepartment) {
        return res.status(403).json({ success: false, message: 'Gestores só podem gerar relatórios para seu próprio departamento.' });
      }
      queryFilters.departamento = userDepartment;
    } else if (filters && filters.departamento) {
      queryFilters.departamento = filters.departamento;
    }

    if (filters && filters.startDate && filters.endDate) {
      queryFilters.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    switch (type) {
      case 'FEEDBACK_SUMMARY':
        const feedbackSummary = await prisma.feedback.groupBy({
          by: ['tipo', 'status'],
          _count: {
            _all: true,
          },
          where: queryFilters,
        });
        reportData = feedbackSummary.map(item => ({
          tipo: item.tipo,
          status: item.status,
          count: item._count._all
        }));
        break;

      case 'USER_ENGAGEMENT':
        // TODO: Implementar lógica para relatório de engajamento
        reportData = { message: 'Relatório de engajamento de usuário ainda não implementado.' };
        break;

      default:
        return res.status(400).json({ success: false, message: 'Tipo de relatório inválido.' });
    }

    const report = await prisma.report.create({
      data: {
        title,
        type,
        filters: filters || {},
        data: reportData,
        generatedBy: userId,
      },
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Listar todos os relatórios gerados
// @route   GET /api/reports
// @access  Private (Admin, Gestor)
const getAllReports = async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const reports = await prisma.report.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      // TODO: Adicionar filtro para gestores verem apenas seus relatórios
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReport,
  getAllReports,
};
