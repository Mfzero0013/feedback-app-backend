const prisma = require('../lib/prisma');

/**
 * @desc    Busca todas as equipes para exibição pública (ex: formulário de cadastro)
 * @route   GET /api/public/teams
 * @access  Public
 */
exports.getAllTeams = async (req, res, next) => {
    try {
        const teams = await prisma.equipe.findMany({
            select: {
                id: true,
                nome: true,
            },
            orderBy: {
                nome: 'asc',
            },
        });

        res.status(200).json({
            status: 'success',
            data: teams,
        });
    } catch (error) {
        next(error);
    }
};
