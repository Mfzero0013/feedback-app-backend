const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

// Obter a equipe do usuário logado
exports.getMyTeam = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // 1. Encontra o usuário atual para obter o ID da sua equipe
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { equipeId: true }
        });

        if (!user) {
            return next(new AppError('Usuário não encontrado.', 404));
        }

        if (!user.equipeId) {
            // Se o usuário não pertence a uma equipe, retorna uma resposta amigável
            return res.status(200).json({ 
                status: 'success',
                data: null // Indica que o usuário não tem equipe
            });
        }

        // 2. Busca a equipe e seus membros, incluindo o perfil de cada um
        const teamData = await prisma.equipe.findUnique({
            where: { id: user.equipeId },
            include: {
                membros: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        cargo: true,
                        jobTitle: true
                    }
                }
            }
        });

        if (!teamData) {
            return next(new AppError('Equipe não encontrada.', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                nome: teamData.nome,
                usuarios: teamData.membros
            }
        });

    } catch (error) {
        console.error('Error in getMyTeam:', error);
        next(error);
    }
};
