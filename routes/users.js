const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const { authenticateToken, requirePermission, auditLog } = require('../middleware/auth');

const router = express.Router();

// Schemas de validação
const updateUserSchema = Joi.object({
    nome: Joi.string().min(3).max(100).optional(),
    email: Joi.string().email().optional(),
    senha: Joi.string().min(6).optional().allow('', null) // Senha é opcional
});

// A partir daqui, todas as rotas são protegidas
router.use(authenticateToken);

// GET /api/users - Listar todos os usuários
router.get('/', requirePermission('view_users'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
                status: true,
                departamento: { select: { id: true, nome: true } }
            }
        });
        res.json({ users });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/users/:id - Obter um usuário específico
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    // Um usuário pode ver seu próprio perfil, ou um admin pode ver qualquer perfil
    if (req.user.userId !== id && req.user.cargo !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
                status: true,
                departamento: { select: { id: true, nome: true } }
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/users/:id - Atualizar um usuário
router.put('/:id', auditLog('UPDATE_USER_PROFILE', 'users', 'id'), async (req, res) => {
    const { id } = req.params;
    if (req.user.userId !== id && req.user.cargo !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.details.map(d => d.message) });
    }

    try {
        const dataToUpdate = {};
        if (value.nome) dataToUpdate.nome = value.nome;
        if (value.email) {
            const existingUser = await prisma.user.findUnique({ where: { email: value.email } });
            if (existingUser && existingUser.id !== id) {
                return res.status(409).json({ error: 'Este email já está em uso' });
            }
            dataToUpdate.email = value.email;
        }
        if (value.senha) {
            dataToUpdate.senha = await bcrypt.hash(value.senha, 12);
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ error: 'Nenhum dado para atualizar foi fornecido' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: { id: true, nome: true, email: true, cargo: true, status: true }
        });

        res.json(updatedUser);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
