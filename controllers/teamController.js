const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');

// Obter a equipe do usuário logado
exports.getMyTeam = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // 1. Encontra o usuário atual para obter o ID da sua equipe
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { equipeId: true, cargo: true }
        });

        if (!user) {
            return next(new AppError('Usuário não encontrado.', 404));
        }

        let teamId = user.equipeId;

        // Se o usuário é um GESTOR e não está em uma equipe, busca a equipe que ele gerencia
        if (!teamId && user.cargo === 'GESTOR') {
            const managedTeam = await prisma.equipe.findFirst({
                where: { gestorId: userId },
                select: { id: true }
            });
            if (managedTeam) {
                teamId = managedTeam.id;
            }
        }

        if (!teamId) {
            // Se ainda não há equipe, retorna uma resposta vazia
            return res.status(200).json({ 
                status: 'success',
                data: null
            });
        }

        // 2. Busca a equipe e seus membros, incluindo o perfil de cada um
        const teamData = await prisma.equipe.findUnique({
            where: { id: teamId },
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
