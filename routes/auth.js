const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');
const { registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();
const prisma = new PrismaClient();

// Rota de Login
router.post('/login', loginUser);

// Rota para obter o perfil do usuário logado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        status: true, // Corrigido de 'ativo' para 'status'
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// Rota de Registro de Usuário
router.post('/register', registerUser);

module.exports = router;
