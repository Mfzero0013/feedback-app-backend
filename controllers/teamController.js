<<<<<<< HEAD
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
=======
const prisma = require('../lib/prisma');
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
const AppError = require('../utils/AppError');

// Obter a equipe do usuário logado
exports.getMyTeam = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // 1. Encontra o usuário atual para obter o ID da sua equipe
        const user = await prisma.user.findUnique({
            where: { id: userId },
<<<<<<< HEAD
            select: { equipeId: true }
=======
            select: { equipeId: true, cargo: true }
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
        });

        if (!user) {
            return next(new AppError('Usuário não encontrado.', 404));
        }

<<<<<<< HEAD
        if (!user.equipeId) {
            // Se o usuário não pertence a uma equipe, retorna uma resposta amigável
            return res.status(200).json({ 
                data: {
                    nome: 'Sem equipe',
                    usuarios: []
                }
=======
        let teamId = user.equipeId;

        // Se o usuário for um administrador, retorna todos os usuários
        if (user.cargo === 'ADMINISTRADOR') {
            const allUsers = await prisma.user.findMany({
                select: { id: true, nome: true, email: true, cargo: true, jobTitle: true }
            });
            // Para administradores, o nome da equipe será 'Administração' e os membros são todos os usuários
            return res.status(200).json({ status: 'success', data: { nome: 'Administração', usuarios: allUsers } });
        }

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
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
            });
        }

        // 2. Busca a equipe e seus membros, incluindo o perfil de cada um
        const teamData = await prisma.equipe.findUnique({
<<<<<<< HEAD
            where: { id: user.equipeId },
            include: {
                usuarios: {
                    include: {
                        perfil: true
=======
            where: { id: teamId },
            include: {
                membros: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        cargo: true,
                        jobTitle: true
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
                    }
                }
            }
        });

        if (!teamData) {
            return next(new AppError('Equipe não encontrada.', 404));
        }

<<<<<<< HEAD
        // 3. Filtra e mapeia os membros da equipe de forma segura
        const members = teamData.usuarios
            .filter(user => user.perfil) // Garante que apenas usuários com perfil sejam processados
            .map(user => ({
                id: user.id,
                nome: user.nome,
                email: user.email,
                cargo: user.perfil.cargo,
                jobTitle: user.perfil.jobTitle
            }));

=======
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
        res.status(200).json({
            status: 'success',
            data: {
                nome: teamData.nome,
<<<<<<< HEAD
                usuarios: members
=======
                usuarios: teamData.membros
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
            }
        });

    } catch (error) {
<<<<<<< HEAD
=======
        console.error('Error in getMyTeam:', error);
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
        next(error);
    }
};
