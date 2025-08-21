const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

// Gerar relatório geral de feedbacks
exports.getGeneralReport = async (req, res, next) => {
    try {
        const totalFeedbacks = await prisma.feedback.count();
        const feedbacksByStatus = await prisma.feedback.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
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
        const userFeedbackCounts = await prisma.user.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                _count: {
                    select: { feedbacks: true },
                },
            },
            orderBy: {
                feedbacks: {
                    _count: 'desc',
                },
            },
            take: 10, // Top 10 usuários mais engajados
        });

        res.status(200).json({ status: 'success', data: userFeedbackCounts });
    } catch (error) {
        console.error('Error in getEngagementReport:', error);
        next(error);
    }
};
