const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

// POST /api/feedback
const createFeedback = async (req, res, next) => {
    const autorId = req.user.userId;
    const { titulo, descricao, tipo, destinatarioId, anonimo } = req.body;

    if (!titulo || !descricao || !tipo || !destinatarioId) {
        return next(new AppError('Todos os campos obrigatórios devem ser preenchidos.', 400));
    }

    try {
        const feedbackType = await prisma.feedbackType.findFirst({
            where: { nome: { equals: tipo, mode: 'insensitive' } },
        });

        if (!feedbackType) {
            return next(new AppError(`Tipo de feedback inválido: ${tipo}`, 400));
        }

        const destinatario = await prisma.user.findUnique({ where: { id: destinatarioId } });
        if (!destinatario) {
            return next(new AppError('Usuário destinatário não encontrado.', 404));
        }

        const newFeedback = await prisma.feedback.create({
            data: {
                titulo,
                descricao: descricao, // Corrigido para usar 'descricao'
                tipoId: feedbackType.id,
                avaliadoId: destinatarioId,
                autorId: anonimo ? null : autorId,
                isAnonymous: anonimo,
                equipeId: destinatario.equipeId,
            },
        });

        res.status(201).json({ message: 'Feedback criado com sucesso!', data: newFeedback });
    } catch (error) {
        console.error('Error in createFeedback:', error);
        next(error);
    }
};

const getFeedbacks = async (req, res, next) => {
    const { type } = req.query; // 'received' ou 'sent'
    const userId = req.user.userId;

    let whereClause = {};
    if (type === 'received') {
        whereClause = { avaliadoId: userId };
    } else if (type === 'sent') {
        whereClause = { autorId: userId };
    } else {
        return next(new AppError('O tipo de feedback especificado é inválido.', 400));
    }

    try {
        const feedbacks = await prisma.feedback.findMany({
            where: whereClause,
            include: {
                autor: { select: { id: true, nome: true, cargo: true } },
                avaliado: { select: { id: true, nome: true, cargo: true } },
                tipo: { select: { nome: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ data: feedbacks });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createFeedback,
    getFeedbacks,
};
