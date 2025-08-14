const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Rota para criar um novo usuário (Cadastro)
// Esta rota é pública, não requer autenticação
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Este email já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USUARIO',
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno ao criar usuário.' });
  }
});

// A partir daqui, todas as rotas são protegidas
router.use(authenticateToken);

// Rota para listar todos os usuários (apenas para administradores)
router.get('/', requirePermission(['ADMINISTRADOR']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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

  if (req.user.role !== 'ADMINISTRADOR' && req.user.userId !== parseInt(id)) {
      return res.status(403).json({ error: 'Acesso negado.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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

// Rota para atualizar um usuário
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (req.user.role !== 'ADMINISTRADOR' && req.user.userId !== parseInt(id)) {
        return res.status(403).json({ error: 'Acesso negado. Você só pode atualizar seu próprio perfil.' });
    }

    if (role && req.user.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Acesso negado. Você não pode alterar sua própria role.' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                name,
                email,
                role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
        res.json(updatedUser);
    } catch (error) {
        if (error.code === 'P2002') { 
            return res.status(409).json({ error: 'Este email já está em uso.' });
        }
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

// Rota para deletar um usuário (apenas para administradores)
router.delete('/:id', requirePermission(['ADMINISTRADOR']), async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') { 
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.status(500).json({ error: 'Erro ao deletar usuário.' });
    }
});


module.exports = router;
