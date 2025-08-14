const { getPrismaClient } = require('../database/connection');
const logger = require('../utils/logger');
const sendEmail = require('../utils/email');

// @desc    Criar um novo feedback
// @route   POST /api/feedbacks
// @access  Private
const createFeedback = async (req, res, next) => {
  try {
    const { avaliado_id, tipo, categoria, conteudo, pontos_fortes, pontos_melhoria, nota } = req.body;
    const avaliador_id = req.user.id;
    const prisma = getPrismaClient();

    const feedback = await prisma.feedback.create({
      data: {
        avaliador_id,
        avaliado_id,
        tipo,
        categoria,
        conteudo,
        pontos_fortes,
        pontos_melhoria,
        nota: nota ? parseInt(nota) : null,
      }
    });

    // Notificar o gestor do departamento por e-mail
    if (feedback.departamento) {
      const gestor = await prisma.user.findFirst({
        where: {
          departamento: feedback.departamento,
          perfil: 'GESTOR',
        },
      });

      if (gestor && gestor.email) {
        const subject = `Novo Feedback Recebido no Departamento ${feedback.departamento}`;
        const message = `
          <p>Olá, ${gestor.nome},</p>
          <p>Um novo feedback do tipo "${feedback.tipo}" foi registrado para o seu departamento.</p>
          <p><strong>Título:</strong> ${feedback.titulo}</p>
          <p>Por favor, acesse a plataforma para mais detalhes.</p>
          <br>
          <p>Atenciosamente,</p>
          <p>Equipe FeedbackHub</p>
        `;
        
        // O envio do e-mail é assíncrono e não bloqueia a resposta ao usuário
        sendEmail({ to: gestor.email, subject, html: message }).catch(err => {
          logger.error(`Falha ao enviar e-mail de notificação para o gestor ${gestor.email}:`, err);
        });
      }
    }

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter todos os feedbacks com filtros
// @route   GET /api/feedbacks
// @access  Private
const getAllFeedbacks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tipo, categoria, status, avaliador_id, avaliado_id } = req.query;
    const prisma = getPrismaClient();
    const user = req.user;

    const where = {};

    // Filtros de query
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (status) where.status = status;
    if (avaliador_id) where.avaliador_id = avaliador_id;
    if (avaliado_id) where.avaliado_id = avaliado_id;

    // Lógica de permissão
    if (user.perfil === 'USUARIO') {
      where.OR = [
        { avaliador_id: user.id },
        { avaliado_id: user.id }
      ];
    } else if (user.perfil === 'GESTOR') {
      // Gestor pode ver feedbacks do seu departamento
      const departmentUsers = await prisma.user.findMany({
        where: { departamento: user.departamento },
        select: { id: true }
      });
      const userIds = departmentUsers.map(u => u.id);
      where.OR = [
        { avaliador_id: { in: userIds } },
        { avaliado_id: { in: userIds } }
      ];
    }
    // ADMIN pode ver tudo, não precisa de filtro adicional de permissão

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        avaliador: { select: { id: true, nome: true, foto: true } },
        avaliado: { select: { id: true, nome: true, foto: true } }
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { dataFeedback: 'desc' }
    });

    const total = await prisma.feedback.count({ where });

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
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

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        avaliador: { select: { id: true, nome: true } },
        avaliado: { select: { id: true, nome: true } }
      }
    });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback não encontrado' });
    }

    // Lógica de permissão
    const isOwner = feedback.avaliador_id === req.user.id || feedback.avaliado_id === req.user.id;
    if (req.user.perfil === 'USUARIO' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar o status de um feedback
// @route   PUT /api/feedbacks/:id
// @access  Private
const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const prisma = getPrismaClient();

    const feedback = await prisma.feedback.findUnique({ where: { id } });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback não encontrado' });
    }

    // Apenas o avaliado ou um admin/gestor pode mudar o status
    const canUpdate = req.user.perfil !== 'USUARIO' || feedback.avaliado_id === req.user.id;
    if (!canUpdate) {
      return res.status(403).json({ success: false, message: 'Ação não permitida' });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, data: updatedFeedback });
  } catch (error) {
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

    res.json({ success: true, message: 'Feedback deletado com sucesso' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFeedback,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback
};
