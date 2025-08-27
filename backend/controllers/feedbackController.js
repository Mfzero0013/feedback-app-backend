const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

// POST /api/feedback
const createFeedback = async (req, res, next) => {
    const autorId = req.user.userId;
    const { titulo, descricao, tipo, destinatarioId, anonimo, nota } = req.body;

    if (!titulo || !descricao || !tipo || !destinatarioId) {
        return next(new AppError('Todos os campos obrigatórios devem ser preenchidos.', 400));
    }

    try {
        const destinatario = await prisma.user.findUnique({ where: { id: destinatarioId } });
        if (!destinatario) {
            return next(new AppError('Usuário destinatário não encontrado.', 404));
        }

        const newFeedback = await prisma.feedback.create({
            data: {
                titulo,
                descricao,
                tipo, // Salva o texto livre
                avaliadoId: destinatarioId,
                autorId: anonimo ? null : autorId,
                isAnonymous: anonimo,
                equipeId: destinatario.equipeId,
                nota: nota ? parseInt(nota, 10) : null,
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
    const userRole = req.user.role;

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

module.exports = {
    createFeedback,
    getFeedbacks,
};
