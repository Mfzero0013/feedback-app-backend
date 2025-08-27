const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

// Gerar relatório geral de feedbacks
exports.getGeneralReport = async (req, res, next) => {
    try {
        const { userId, startDate, endDate } = req.query;
        const where = {};

        if (userId) {
            where.avaliadoId = userId;
        }
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const totalFeedbacks = await prisma.feedback.count({ where });

        const feedbacksByStatus = await prisma.feedback.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
            where,
        });

        const report = {
            totalFeedbacks,
            feedbacksByStatus,
        };

        res.status(200).json({ status: 'success', data: report });
    } catch (error) {
        console.error('Error in getGeneralReport:', error);
        next(error);
    }
};

// Gerar relatório de engajamento de usuários
exports.getEngagementReport = async (req, res, next) => {
    try {
        const { userId, startDate, endDate } = req.query;
        const userWhere = {};
        if (userId) {
            userWhere.id = userId;
        }

        const feedbackWhere = {};
        if (userId) {
            feedbackWhere.avaliadoId = userId;
        }
        if (startDate && endDate) {
            feedbackWhere.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        let users = await prisma.user.findMany({
            where: userWhere,
            select: {
                id: true,
                nome: true,
                email: true,
                _count: {
                    select: { 
                        feedbacksRecebidos: { where: feedbackWhere } 
                    },
                },
            },
        });

        // Ordena os usuários pela contagem de feedbacks recebidos em ordem decrescente
        users.sort((a, b) => (b._count.feedbacksRecebidos || 0) - (a._count.feedbacksRecebidos || 0));

        // Pega os top 10 após a ordenação
        const userFeedbackCounts = users.slice(0, 10);

        res.status(200).json({ status: 'success', data: userFeedbackCounts });
    } catch (error) {
        console.error('Error in getEngagementReport:', error);
        next(error);
    }
};
