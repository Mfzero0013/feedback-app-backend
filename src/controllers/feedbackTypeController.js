const prisma = require('../lib/prisma');

// @desc    Listar todos os tipos de feedback
// @route   GET /api/feedback-types
// @access  Private (Admin)
const getAllFeedbackTypes = async (req, res) => {
  try {
    const feedbackTypes = await prisma.feedbackType.findMany({
      orderBy: {
        nome: 'asc',
      },
    });
    res.status(200).json(feedbackTypes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar os tipos de feedback.', error: error.message });
  }
};

// @desc    Criar um novo tipo de feedback
// @route   POST /api/feedback-types
// @access  Private (Admin)
const createFeedbackType = async (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ message: 'O nome do tipo de feedback é obrigatório.' });
  }

  try {
    const newFeedbackType = await prisma.feedbackType.create({
      data: {
        nome,
      },
    });
    res.status(201).json(newFeedbackType);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Este tipo de feedback já existe.' });
    }
    res.status(500).json({ message: 'Erro ao criar o tipo de feedback.', error: error.message });
  }
};

// @desc    Atualizar um tipo de feedback
// @route   PUT /api/feedback-types/:id
// @access  Private (Admin)
const updateFeedbackType = async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ message: 'O nome é obrigatório.' });
  }

  try {
    const updatedFeedbackType = await prisma.feedbackType.update({
      where: { id },
      data: { nome },
    });
    res.status(200).json(updatedFeedbackType);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Tipo de feedback não encontrado.' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Este nome de tipo de feedback já está em uso.' });
    }
    res.status(500).json({ message: 'Erro ao atualizar o tipo de feedback.', error: error.message });
  }
};

// @desc    Deletar um tipo de feedback
// @route   DELETE /api/feedback-types/:id
// @access  Private (Admin)
const deleteFeedbackType = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.feedbackType.delete({
      where: { id },
    });
    res.status(204).send(); // No Content
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Tipo de feedback não encontrado.' });
    }
    // Trata o caso de existirem feedbacks associados a este tipo
    if (error.code === 'P2003') {
        return res.status(409).json({ message: 'Não é possível deletar. Existem feedbacks associados a este tipo.' });
    }
    res.status(500).json({ message: 'Erro ao deletar o tipo de feedback.', error: error.message });
  }
};

module.exports = {
  getAllFeedbackTypes,
  createFeedbackType,
  updateFeedbackType,
  deleteFeedbackType,
};
