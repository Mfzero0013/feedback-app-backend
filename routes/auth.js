const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Schema de validação para o login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Rota de Login
router.post('/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message, code: 'VALIDATION_ERROR' });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' });
    }

    // CORREÇÃO CRÍTICA: Verificar o campo 'status' com o valor 'ATIVO'
    if (user.status !== 'ATIVO') {
      return res.status(403).json({ error: 'Usuário inativo', code: 'USER_INACTIVE' });
    }

    // Geração do Token JWT
    const token = jwt.sign(
      { userId: user.id, perfil: user.perfil }, // Payload consistente com o middleware
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
      },
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

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

module.exports = router;
