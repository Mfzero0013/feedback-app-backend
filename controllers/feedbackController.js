<<<<<<< HEAD
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/feedback
const createFeedback = async (req, res) => {
    // O autor é identificado pelo middleware de autenticação e adicionado ao req.user
    const autorId = req.user.id;
    const { titulo, conteudo, tipo, destinatarioId, anonimo } = req.body;

    if (!titulo || !conteudo || !tipo || !destinatarioId) {
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    try {
        // O frontend envia o NOME do tipo (ex: 'ELOGIO'), precisamos do ID.
        const feedbackType = await prisma.feedbackType.findUnique({
            where: { nome: tipo },
        });

        if (!feedbackType) {
            // Se o tipo não existir, podemos criá-lo ou retornar um erro.
            // Por segurança, vamos retornar um erro.
            return res.status(400).json({ message: `Tipo de feedback inválido: ${tipo}` });
        }

        const destinatario = await prisma.user.findUnique({ where: { id: destinatarioId } });
        if (!destinatario) {
            return res.status(404).json({ message: 'Usuário destinatário não encontrado.' });
=======
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
        const destinatario = await prisma.user.findUnique({ where: { id: destinatarioId } });
        if (!destinatario) {
            return next(new AppError('Usuário destinatário não encontrado.', 404));
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
        }

        const newFeedback = await prisma.feedback.create({
            data: {
                titulo,
<<<<<<< HEAD
                descricao: conteudo,
                tipoId: feedbackType.id,
=======
                descricao,
                tipo, // Salva o texto livre
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
                avaliadoId: destinatarioId,
                autorId: anonimo ? null : autorId,
                isAnonymous: anonimo,
                equipeId: destinatario.equipeId,
            },
        });

        res.status(201).json({ message: 'Feedback criado com sucesso!', data: newFeedback });
    } catch (error) {
<<<<<<< HEAD
        console.error('Erro ao criar feedback:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar feedback.', error: error.message });
=======
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
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ data: feedbacks });
    } catch (error) {
        next(error);
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
    }
};

module.exports = {
    createFeedback,
<<<<<<< HEAD
=======
    getFeedbacks,
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
};
