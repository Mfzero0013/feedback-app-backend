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
        }

        const newFeedback = await prisma.feedback.create({
            data: {
                titulo,
                descricao: conteudo,
                tipoId: feedbackType.id,
                avaliadoId: destinatarioId,
                autorId: anonimo ? null : autorId,
                isAnonymous: anonimo,
                equipeId: destinatario.equipeId,
            },
        });

        res.status(201).json({ message: 'Feedback criado com sucesso!', data: newFeedback });
    } catch (error) {
        console.error('Erro ao criar feedback:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar feedback.', error: error.message });
    }
};

module.exports = {
    createFeedback,
};
