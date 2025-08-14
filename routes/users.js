const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Rota para criar um novo usuário (Cadastro)
router.post('/', async (req, res) => {
  // Usando os nomes corretos do schema: nome, email, senha, perfil
  const { nome, email, senha, perfil } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Este email já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 12);

    const newUser = await prisma.user.create({
      data: {
        nome,
        email,
        senha: hashedPassword,
        perfil: perfil || 'USUARIO',
      },
    });

    // Remove a senha da resposta
    const { senha: _, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno ao criar usuário.' });
  }
});

// A partir daqui, todas as rotas são protegidas
router.use(authenticateToken);

// Rota para listar todos os usuários (apenas para administradores)
router.get('/', requirePermission(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// Rota para obter um usuário específico pelo ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (req.user.perfil !== 'ADMIN' && req.user.userId !== id) {
      return res.status(403).json({ error: 'Acesso negado.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

module.exports = router;
