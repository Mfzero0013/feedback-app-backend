const { getPrismaClient } = require('../database/connection');
const logger = require('../utils/logger');

// @desc    Obter todas as configurações do sistema
// @route   GET /api/settings
// @access  Private (Admin)
const getAllSettings = async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const settings = await prisma.systemSetting.findMany();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Criar ou atualizar uma configuração
// @route   POST /api/settings
// @access  Private (Admin)
const upsertSetting = async (req, res, next) => {
  try {
    const { chave, valor, descricao } = req.body;
    const prisma = getPrismaClient();

    const setting = await prisma.systemSetting.upsert({
      where: { chave },
      update: { valor, descricao },
      create: { chave, valor, descricao },
    });

    res.status(201).json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

// @desc    Obter uma configuração pela chave
// @route   GET /api/settings/:key
// @access  Private (Admin)
const getSettingByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const prisma = getPrismaClient();

    const setting = await prisma.systemSetting.findUnique({ where: { chave: key } });

    if (!setting) {
      return res.status(404).json({ success: false, message: 'Configuração não encontrada' });
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar uma configuração
// @route   DELETE /api/settings/:key
// @access  Private (Admin)
const deleteSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const prisma = getPrismaClient();

    await prisma.systemSetting.delete({ where: { chave: key } });

    res.json({ success: true, message: 'Configuração deletada com sucesso' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSettings,
  upsertSetting,
  getSettingByKey,
  deleteSetting
};
