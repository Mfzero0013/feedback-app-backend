const { getPrismaClient } = require('../database/connection');
const logger = require('../utils/logger');
const sendEmail = require('../utils/email');

// @desc    Criar um novo feedback
// @route   POST /api/feedbacks
// @access  Private
const createFeedback = async (req, res, next) => {
  try {
    const { titulo, descricao, observacao, tipo, isAnonymous, avaliadoId, equipeId } = req.body;
    const autorId = req.user.id;
    const prisma = getPrismaClient();

    // Validação básica
    if (!titulo || !descricao || !tipo || !avaliadoId) {
        return res.status(400).json({ success: false, message: 'Campos obrigatórios não preenchidos.' });
    }

    const feedbackData = {
        titulo,
        descricao,
        observacao,
        tipo,
        isAnonymous: isAnonymous || false,
        avaliado: { connect: { id: avaliadoId } },
        // O autor só é conectado se o feedback não for anônimo
        ...( !isAnonymous && { autor: { connect: { id: autorId } } } ),
        // A equipe é conectada se um ID for fornecido
        ...(equipeId && { equipe: { connect: { id: equipeId } } })
    };

    const feedback = await prisma.feedback.create({ data: feedbackData });

    // TODO: Reimplementar notificação por e-mail para o gestor da equipe, se aplicável.

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    logger.error('Erro ao criar feedback:', error);
    next(error);
  }
};

// @desc    Obter todos os feedbacks com filtros
// @route   GET /api/feedbacks
// @access  Private
const getAllFeedbacks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tipo, status, autorId, avaliadoId } = req.query;
    const prisma = getPrismaClient();
    const user = req.user;

    const where = {};

    // Filtros de query
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;
    if (autorId) where.autorId = autorId;
    if (avaliadoId) where.avaliadoId = avaliadoId;

    // Lógica de permissão
    if (user.cargo === 'COLABORADOR') {
      where.OR = [
        { autorId: user.id },
        { avaliadoId: user.id }
      ];
    } else if (user.cargo === 'GESTOR') {
      const managedTeam = await prisma.equipe.findUnique({ where: { gestorId: user.id }, include: { membros: { select: { id: true } } } });
      if (managedTeam) {
        const memberIds = managedTeam.membros.map(m => m.id);
        memberIds.push(user.id); // O gestor também faz parte
        where.OR = [
            { autorId: { in: memberIds } },
            { avaliadoId: { in: memberIds } }
        ];
      }
    }
    // ADMIN pode ver tudo, não precisa de filtro adicional de permissão

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        autor: { select: { id: true, nome: true, foto: true } },
        avaliado: { select: { id: true, nome: true, foto: true } }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.feedback.count({ where });

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar feedbacks:', error);
    next(error);
  }
};

// @desc    Obter um feedback pelo ID
// @route   GET /api/feedbacks/:id
// @access  Private
const getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prisma = getPrismaClient();
    const user = req.user;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        autor: { select: { id: true, nome: true, foto: true } },
        avaliado: { select: { id: true, nome: true, foto: true } }
      }
    });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback não encontrado' });
    }

    // Lógica de permissão
    const isOwner = feedback.autorId === user.id || feedback.avaliadoId === user.id;
    let isTeamManager = false;

    if (user.cargo === 'GESTOR') {
        const managedTeam = await prisma.equipe.findUnique({ where: { gestorId: user.id }, include: { membros: { select: { id: true } } } });
        if (managedTeam) {
            const memberIds = managedTeam.membros.map(m => m.id);
            isTeamManager = memberIds.includes(feedback.autorId) || memberIds.includes(feedback.avaliadoId);
        }
    }

    if (user.cargo !== 'ADMINISTRADOR' && !isOwner && !isTeamManager) {
        return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    res.json({ success: true, data: feedback });
  } catch (error) {
    logger.error(`Erro ao buscar feedback ${req.params.id}:`, error);
    next(error);
  }
};

// @desc    Atualizar o status de um feedback
// @route   PUT /api/feedbacks/:id
// @access  Private
const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, observacao } = req.body;
    const prisma = getPrismaClient();

    // A rota já restringe para GESTOR e ADMINISTRADOR, então a verificação de cargo aqui é um reforço.
    // A lógica de negócio principal é que apenas eles podem mudar o status.

    const dataToUpdate = {};
    if (status) dataToUpdate.status = status;
    if (observacao) dataToUpdate.observacao = observacao;

    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ success: false, message: 'Nenhum dado para atualizar foi fornecido.' });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: dataToUpdate
    });

    res.json({ success: true, data: updatedFeedback });
  } catch (error) {
    logger.error(`Erro ao atualizar status do feedback ${req.params.id}:`, error);
    next(error);
  }
};

// @desc    Deletar um feedback
// @route   DELETE /api/feedbacks/:id
// @access  Private (Admin)
const deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prisma = getPrismaClient();

    await prisma.feedback.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Feedback deletado com sucesso' });
  } catch (error) {
    logger.error(`Erro ao deletar feedback ${req.params.id}:`, error);
    next(error);
  }
};

// @desc    Obter feedbacks enviados pelo usuário logado
// @route   GET /api/feedbacks/meus-feedbacks
// @access  Private
const getMySentFeedbacks = async (req, res, next) => {
    req.query.autorId = req.user.id;
    return getAllFeedbacks(req, res, next);
};

// @desc    Obter feedbacks recebidos pelo usuário logado
// @route   GET /api/feedbacks/feedbacks-recebidos
// @access  Private
const getMyReceivedFeedbacks = async (req, res, next) => {
    req.query.avaliadoId = req.user.id;
    return getAllFeedbacks(req, res, next);
};

// @desc    Obter feedbacks da equipe do gestor logado
// @route   GET /api/feedbacks/equipe
// @access  Private (GESTOR)
const getTeamFeedbacks = async (req, res, next) => {
    try {
        const prisma = getPrismaClient();
        const user = req.user;

        const managedTeam = await prisma.equipe.findUnique({ 
            where: { gestorId: user.id }, 
            include: { membros: { select: { id: true } } } 
        });

        if (!managedTeam) {
            return res.status(404).json({ success: false, message: 'Nenhuma equipe gerenciada por você foi encontrada.' });
        }

        const memberIds = managedTeam.membros.map(m => m.id);
        memberIds.push(user.id);

        req.query.avaliadoId = { in: memberIds }; // Filtra por membros da equipe
        return getAllFeedbacks(req, res, next);

    } catch (error) {
        logger.error(`Erro ao buscar feedbacks da equipe do gestor ${user.id}:`, error);
        next(error);
    }
};

module.exports = {
  createFeedback,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  getMySentFeedbacks,
  getMyReceivedFeedbacks,
  getTeamFeedbacks
};
