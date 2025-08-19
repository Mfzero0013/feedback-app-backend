const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AppError = require('../utils/AppError');

// Obter os dados do usuário logado (perfil)
exports.getMe = async (req, res, next) => {
    try {
        // CORREÇÃO: O ID do usuário no token é 'userId', não 'id'.
        const userId = req.user.userId;
        if (!userId) {
            return next(new AppError('ID do usuário não encontrado no token.', 400));
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                equipe: true, // Inclui os dados da equipe associada
            },
        });

        if (!user) {
            return next(new AppError('Usuário não encontrado.', 404));
        }

        res.status(200).json({ status: 'success', data: user });

    } catch (error) {
        next(error);
    }
};

// Atualizar os dados do usuário logado
exports.updateMe = async (req, res, next) => {
    try {
        const { nome, jobTitle } = req.body;

        // Apenas nome e jobTitle podem ser atualizados por esta rota
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                nome,
                jobTitle
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser
            }
        });

    } catch (error) {
        next(error);
    }
};
