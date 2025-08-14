const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Esquema de validação para login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST /api/auth/login - Autenticação de usuário
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
    
    if (!user.ativo) {
        return res.status(403).json({ error: 'Usuário inativo', code: 'USER_INACTIVE' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.perfil },
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

// GET /api/auth/profile - Obter perfil do usuário logado
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                ativo: true,
                departamento: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
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
