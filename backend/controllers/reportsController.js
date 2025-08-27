const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

// Gerar relatório geral de feedbacks
exports.getGeneralReport = async (req, res, next) => {
    try {
        const { userId, feedbackType, startDate, endDate } = req.query;
        const where = {};

        if (userId) where.avaliadoId = userId;
        if (feedbackType) where.tipo = { nome: feedbackType };
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const totalFeedbacks = await prisma.feedback.count({ where });
        const report = {
            totalFeedbacks,
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
        const where = {};

        if (userId) where.id = userId;

        const feedbackWhere = {};
        if (startDate && endDate) {
            feedbackWhere.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const userFeedbackCounts = await prisma.user.findMany({
            where,
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
            orderBy: {
                feedbacksRecebidos: {
                    _count: 'desc',
                },
            },
            take: 10,
        });

        res.status(200).json({ status: 'success', data: userFeedbackCounts });
    } catch (error) {
        console.error('Error in getEngagementReport:', error);
        next(error);
    }
};
