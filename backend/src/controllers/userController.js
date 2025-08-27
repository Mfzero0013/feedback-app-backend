const { getPrismaClient } = require('../database/connection');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// @desc    Obter todos os usuários com filtros e paginação
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, department, status } = req.query;
    const prisma = getPrismaClient();

    const where = {};
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) where.perfil = role;
    if (department) where.departamento = { contains: department, mode: 'insensitive' };
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, nome: true, email: true, cargo: true, departamento: true, perfil: true, status: true, createdAt: true
      }
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: users,
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

// @desc    Obter um usuário pelo ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, nome: true, email: true, cargo: true, departamento: true, perfil: true, status: true, foto: true, telefone: true, dataAdmissao: true, createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar um usuário
// @route   PUT /api/users/:id
// @access  Private (Admin ou próprio usuário)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dataToUpdate = req.body;
    const prisma = getPrismaClient();

    // Lógica de permissão
    if (req.user.perfil !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    // Admins podem mudar o perfil, outros não
    if (req.user.perfil !== 'ADMIN' && dataToUpdate.perfil) {
      delete dataToUpdate.perfil;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true, nome: true, email: true, cargo: true, departamento: true, perfil: true, status: true
      }
    });

    res.json({ success: true, message: 'Usuário atualizado com sucesso', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar um usuário (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prisma = getPrismaClient();

    await prisma.user.update({
      where: { id },
      data: { status: 'INATIVO' }
    });

    res.json({ success: true, message: 'Usuário desativado com sucesso' });
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar foto de perfil do usuário logado
// @route   PUT /api/users/me/photo
// @access  Private
const updateProfilePicture = async (req, res, next) => {
  try {
    const prisma = getPrismaClient();
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo foi enviado.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Deletar a foto antiga se ela existir
    if (user && user.foto) {
      const oldPhotoPath = path.join(__dirname, '..', '..', user.foto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlink(oldPhotoPath, (err) => {
          if (err) {
            logger.error(`Falha ao deletar foto antiga: ${oldPhotoPath}`, err);
          }
        });
      }
    }

    // Salvar o caminho relativo no banco (ex: uploads/photo-123.jpg)
    const filePath = path.join(process.env.UPLOAD_PATH || 'uploads', req.file.filename).replace(/\\/g, '/');

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { foto: filePath },
    });

    res.json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso.',
      // Retorna o caminho completo para ser usado no frontend
      data: { foto: `/${updatedUser.foto}` },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfilePicture
};
