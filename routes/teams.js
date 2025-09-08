const express = require('express');
const Joi = require('joi');
const prisma = require('../src/lib/prisma');
const { auditLog, requirePermission } = require('../middleware/auth');

const router = express.Router();

const teamSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  descricao: Joi.string().allow('', null)
});

// GET /api/teams - Listar todos os departamentos
router.get('/', async (req, res) => {
  try {
    // Versão robusta para garantir que apenas os dados necessários sejam enviados.
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        nome: true
      },
      orderBy: {
        nome: 'asc'
      }
    });
    res.json({ teams: departments });
  } catch (error) {
    console.error('Falha crítica ao buscar departamentos:', error);
    res.status(500).json({ error: 'Não foi possível carregar os departamentos.', code: 'DEPARTMENT_FETCH_FAILED' });
  }
});

// GET /api/teams/:id - Obter um departamento
router.get('/:id', requirePermission('view_teams'), async (req, res) => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: { users: { select: { id: true, nome: true, email: true } } }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado', code: 'TEAM_NOT_FOUND' });
    }

    res.json(department);
  } catch (error) {
    console.error('Erro ao obter departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/teams - Criar um novo departamento
router.post('/', requirePermission('manage_teams'), auditLog('CREATE_TEAM', 'departments'), async (req, res) => {
  try {
    const { error, value } = teamSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.details.map(d => d.message) });
    }

    const newDepartment = await prisma.department.create({ data: value });
    res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Erro ao criar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/teams/:id - Atualizar um departamento
router.put('/:id', requirePermission('manage_teams'), auditLog('UPDATE_TEAM', 'departments', 'id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = teamSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.details.map(d => d.message) });
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: value
    });

    res.json(updatedDepartment);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Departamento não encontrado', code: 'TEAM_NOT_FOUND' });
    }
    console.error('Erro ao atualizar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/teams/:id - Remover um departamento
router.delete('/:id', requirePermission('manage_teams'), auditLog('DELETE_TEAM', 'departments', 'id'), async (req, res) => {
  try {
    const { id } = req.params;

    const usersInDept = await prisma.user.count({ where: { departamentoId: id } });
    if (usersInDept > 0) {
      return res.status(400).json({ error: 'Não é possível remover um departamento com membros associados.', code: 'TEAM_NOT_EMPTY' });
    }

    await prisma.department.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Departamento não encontrado', code: 'TEAM_NOT_FOUND' });
    }
    console.error('Erro ao remover departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

const memberSchema = Joi.object({
  usuarioId: Joi.string().uuid().required(),
  equipeId: Joi.string().uuid().required(),
});

const removeMemberSchema = Joi.object({
    usuarioId: Joi.string().uuid().required(),
});

// POST /api/teams/add-member - Adicionar membro a um departamento
router.post('/add-member', requirePermission('manage_teams'), auditLog('ADD_TEAM_MEMBER', 'users'), async (req, res) => {
  try {
    const { error, value } = memberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.details.map(d => d.message) });
    }
    const { usuarioId, equipeId } = value;

    const user = await prisma.user.update({
      where: { id: usuarioId },
      data: { departamentoId: equipeId }
    });

    res.status(200).json({ message: 'Membro adicionado com sucesso!', user });
  } catch (error) {
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário ou departamento não encontrado', code: 'NOT_FOUND' });
    }
    console.error('Erro ao adicionar membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/teams/remove-member - Remover membro de um departamento
router.post('/remove-member', requirePermission('manage_teams'), auditLog('REMOVE_TEAM_MEMBER', 'users'), async (req, res) => {
  try {
    const { error, value } = removeMemberSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.details.map(d => d.message) });
    }
    const { usuarioId } = value;

    const user = await prisma.user.update({
      where: { id: usuarioId },
      data: { departamentoId: null }
    });

    res.status(200).json({ message: 'Membro removido com sucesso!', user });
  } catch (error) {
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    }
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
