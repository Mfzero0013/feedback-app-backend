const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

// POST /api/feedback
const createFeedback = async (req, res, next) => {
    const autorId = req.user.userId;
    const { avaliado_id, tipo, categoria, conteudo, nota } = req.body;

    try {
        const destinatario = await prisma.user.findUnique({ where: { id: avaliado_id } });
        if (!destinatario) {
            return next(new AppError('Usuário destinatário não encontrado.', 404));
        }

        const newFeedback = await prisma.feedback.create({
            data: {
                autorId: autorId,
                avaliadoId: avaliado_id,
                tipo: tipo,
                categoria: categoria,
                conteudo: conteudo,
                nota: nota,
            },
            include: {
                autor: { select: { id: true, nome: true, email: true } },
                avaliado: { select: { id: true, nome: true, email: true } },
            },
        });

        res.status(201).json({ message: 'Feedback criado com sucesso!', data: newFeedback });
    } catch (error) {
        console.error('Error in createFeedback:', error);
        next(error);
    }
};

const getFeedbacks = async (req, res, next) => {
    const { type, userId: queryUserId } = req.query; // 'received' ou 'sent'
    const loggedInUserId = req.user.userId;
    const userRole = req.user.cargo;

    let targetUserId = loggedInUserId;

    // Se um ID de usuário for fornecido na query e o usuário logado for ADMIN, use esse ID.
    if (queryUserId && userRole === 'ADMINISTRADOR') {
        targetUserId = queryUserId;
    } else if (queryUserId && queryUserId !== loggedInUserId) {
        // Impede que usuários não-ADMIN vejam feedbacks de outros.
        return next(new AppError('Você não tem permissão para visualizar os feedbacks de outro usuário.', 403));
    }

    let whereClause = {};
    if (type === 'received') {
        whereClause = { avaliadoId: targetUserId };
    } else if (type === 'sent') {
        whereClause = { autorId: targetUserId };
    } else {
        return next(new AppError('O tipo de feedback especificado é inválido.', 400));
    }

    try {
        const feedbacks = await prisma.feedback.findMany({
            where: whereClause,
            include: {
                autor: { select: { id: true, nome: true, cargo: true } },
                avaliado: { select: { id: true, nome: true, cargo: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ data: feedbacks });
    } catch (error) {
        next(error);
    }
};

const deleteFeedback = async (req, res, next) => {
    const { id } = req.params;

    try {
        const feedback = await prisma.feedback.findUnique({ where: { id } });

        if (!feedback) {
            return next(new AppError('Feedback não encontrado.', 404));
        }

        await prisma.feedback.delete({ where: { id } });

        res.status(200).json({ message: 'Feedback excluído com sucesso!' });
    } catch (error) {
        console.error('Error in deleteFeedback:', error);
        next(error);
    }
};

module.exports = {
    createFeedback,
    getFeedbacks,
    deleteFeedback,
};
