const prisma = require('../lib/prisma');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Apenas ADMINS podem criar equipes
exports.createTeam = catchAsync(async (req, res, next) => {
  const { nome, descricao, gestorId } = req.body;

  const newTeam = await prisma.equipe.create({
    data: {
      nome,
      descricao,
      gestorId,
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      team: newTeam,
    },
  });
});

// Listar todas as equipes
exports.getAllTeams = catchAsync(async (req, res, next) => {
  const teams = await prisma.equipe.findMany({
    include: {
      gestor: { select: { id: true, nome: true, email: true } },
      membros: { select: { id: true, nome: true, email: true } },
    },
  });

  res.status(200).json({
    status: 'success',
    results: teams.length,
    data: {
      teams,
    },
  });
});

// Obter uma equipe por ID
exports.getTeamById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const team = await prisma.equipe.findUnique({
    where: { id },
    include: {
      gestor: { select: { id: true, nome: true, email: true } },
      membros: { select: { id: true, nome: true, email: true } },
    },
  });

  if (!team) {
    return next(new AppError('Nenhuma equipe encontrada com este ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      team,
    },
  });
});

// Atualizar uma equipe (apenas ADMIN ou GESTOR da equipe)
exports.updateTeam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { nome, descricao, gestorId } = req.body;

  const team = await prisma.equipe.update({
    where: { id },
    data: {
      nome,
      descricao,
      gestorId,
    },
  });

  res.status(200).json({
    status: 'success',
    data: {
      team,
    },
  });
});

// Deletar uma equipe (apenas ADMIN)
exports.deleteTeam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await prisma.equipe.delete({ where: { id } });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Adicionar membro a uma equipe
exports.addMemberToTeam = catchAsync(async (req, res, next) => {
    const { equipeId, usuarioId } = req.body;

    const user = await prisma.user.update({
        where: { id: usuarioId },
        data: { equipeId: equipeId },
    });

    res.status(200).json({
        status: 'success',
        message: 'Usuário adicionado à equipe com sucesso.',
        data: {
            user
        }
    });
});

// Remover membro de uma equipe
exports.removeMemberFromTeam = catchAsync(async (req, res, next) => {
    const { usuarioId } = req.body;

    const user = await prisma.user.update({
        where: { id: usuarioId },
        data: { equipeId: null },
    });

    res.status(200).json({
        status: 'success',
        message: 'Usuário removido da equipe com sucesso.',
        data: {
            user
        }
    });
});
