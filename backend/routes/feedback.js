const express = require('express');
const Joi = require('joi');
const prisma = require('../src/lib/prisma');
const { auditLog, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Schema para criar feedback
const createFeedbackSchema = Joi.object({
  titulo: Joi.string().optional(),
  conteudo: Joi.string().required(),
  tipo: Joi.string().valid('ELOGIO', 'CRITICA', 'SUGESTAO').required(),
  avaliado_id: Joi.string().uuid().required(),
  isAnonymous: Joi.boolean().required(),
  nota: Joi.number().min(0).max(10).optional()
});

// Schema para atualizar status do feedback
const updateFeedbackStatusSchema = Joi.object({
  status: Joi.string().valid('ABERTO', 'EM_ANALISE', 'CONCLUIDO').required()
});

// POST /api/feedback - Enviar um novo feedback
router.post('/', requirePermission('send_feedback'), auditLog('SEND_FEEDBACK', 'feedbacks'), async (req, res) => {
  try {
    const { error, value } = createFeedbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.details.map(d => d.message) });
    }

    const autorId = req.user.id;
    const { titulo, conteudo, tipo, avaliado_id, isAnonymous, nota } = value;

    const destinatario = await prisma.user.findUnique({ where: { id: avaliado_id } });
    if (!destinatario) {
      return res.status(404).json({ error: 'Usuário destinatário não encontrado', code: 'RECIPIENT_NOT_FOUND' });
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        titulo,
        conteudo,
        tipo,
        nota,
        isAnonymous,
        autor: { connect: { id: autorId } },
        avaliado: { connect: { id: avaliado_id } },
        equipe: destinatario.departamentoId ? { connect: { id: destinatario.departamentoId } } : undefined
      }
    });

    res.status(201).json(newFeedback);
  } catch (error) {
    console.error('Erro ao enviar feedback:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/feedback - Listar feedbacks (recebidos e enviados)
router.get('/', requirePermission('view_feedback'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type = 'received' } = req.query; // type = received | sent
    const offset = (page - 1) * limit;

    let where = {};
    if (type === 'received') {
      where = { destinatarioId: userId };
    } else if (type === 'sent') {
      where = { autorId: userId };
    } else {
        return res.status(400).json({ error: "Tipo de listagem inválido. Use 'received' ou 'sent'." });
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      skip: offset,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        autor: { select: { id: true, nome: true } },
        destinatario: { select: { id: true, nome: true } }
      }
    });

    const processedFeedbacks = feedbacks.map(fb => {
        if (fb.anonimo && fb.autorId !== userId) {
            return { ...fb, autor: { id: null, nome: 'Anônimo' } };
        }
        return fb;
    });

    const total = await prisma.feedback.count({ where });

    res.json({
      feedbacks: processedFeedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar feedbacks:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/feedback/:id - Obter um feedback específico
router.get('/:id', requirePermission('view_feedback'), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const feedback = await prisma.feedback.findUnique({
            where: { id },
            include: {
                autor: { select: { id: true, nome: true } },
                destinatario: { select: { id: true, nome: true } }
            }
        });

        if (!feedback) {
            return res.status(404).json({ error: 'Feedback não encontrado', code: 'FEEDBACK_NOT_FOUND' });
        }

        if (feedback.autorId !== userId && feedback.destinatarioId !== userId) {
            return res.status(403).json({ error: 'Acesso negado', code: 'FORBIDDEN' });
        }

        if (feedback.anonimo && feedback.autorId !== userId) {
            feedback.autor = { id: null, nome: 'Anônimo' };
        }

        res.json(feedback);
    } catch (error) {
        console.error('Erro ao obter feedback:', error);
        res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
    }
});


// PUT /api/feedback/:id/status - Atualizar o status de um feedback
router.put('/:id/status', requirePermission('manage_feedback'), auditLog('UPDATE_FEEDBACK_STATUS', 'feedbacks', 'id'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error, value } = updateFeedbackStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.details.map(d => d.message) });
    }

    const feedback = await prisma.feedback.findUnique({ where: { id } });

    if (!feedback) {
        return res.status(404).json({ error: 'Feedback não encontrado', code: 'FEEDBACK_NOT_FOUND' });
    }

    if (feedback.destinatarioId !== userId) {
        return res.status(403).json({ error: 'Ação não permitida', code: 'FORBIDDEN' });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { status: value.status }
    });

    res.json(updatedFeedback);
  } catch (error) {
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Feedback não encontrado', code: 'FEEDBACK_NOT_FOUND' });
    }
    console.error('Erro ao atualizar status do feedback:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
