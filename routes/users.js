const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const prisma = require('../src/lib/prisma');
const { requirePermission, requireOwnershipOrAdmin, auditLog } = require('../middleware/auth');

const router = express.Router();

// Schema de validação para criação/edição de usuário
const userSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório'
  }),
  departamentoId: Joi.string().uuid().required().messages({
    'any.required': 'ID do Departamento é obrigatório',
    'string.uuid': 'ID do Departamento deve ser um UUID válido'
  }),
  cargo: Joi.string().required().messages({
    'any.required': 'Cargo é obrigatório'
  }),
  perfil: Joi.string().valid('USUARIO', 'GESTOR', 'ADMIN').required().messages({
    'any.only': 'Perfil deve ser USUARIO, GESTOR ou ADMIN',
    'any.required': 'Perfil é obrigatório'
  }),
  status: Joi.string().valid('ATIVO', 'INATIVO').default('ATIVO').messages({
    'any.only': 'Status deve ser ATIVO ou INATIVO'
  })
});

// Schema de validação para alteração de senha por admin
const adminPasswordSchema = Joi.object({
  password: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  })
});

// GET /api/users - Listar usuários (com filtros)
router.get('/', requirePermission('all'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      department = '', 
      status = '' 
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Mapeamento de roles e status para os enums do Prisma
    const roleMap = { 'Usuário': 'USUARIO', 'Gestor': 'GESTOR', 'Administrador': 'ADMIN' };
    const statusMap = { 'Ativo': 'ATIVO', 'Inativo': 'INATIVO', 'Suspenso': 'INATIVO' };

    // Construir cláusula 'where' para o Prisma
    const where = {};
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cargo: { contains: search, mode: 'insensitive' } },
        { departamento: { nome: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (role && roleMap[role]) {
      where.perfil = roleMap[role];
    }
    if (department) {
      where.departamento = { nome: { equals: department, mode: 'insensitive' } };
    }
    if (status && statusMap[status]) {
      where.status = statusMap[status];
    }

    // Executar queries em paralelo
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          cargo: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          departamento: {
            select: { nome: true }
          }
        },
        orderBy: { nome: 'asc' },
        skip: offset,
        take: limitNum,
      }),
      prisma.user.count({ where })
    ]);

    // Mapear resultado para o formato esperado pelo frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.nome,
      email: user.email,
      role: user.perfil.charAt(0) + user.perfil.slice(1).toLowerCase(), // Converte 'USUARIO' para 'Usuario'
      department: user.departamento?.nome || null,
      position: user.cargo,
      status: user.status.charAt(0) + user.status.slice(1).toLowerCase(), // Converte 'ATIVO' para 'Ativo'
      created_at: user.createdAt,
      updated_at: user.updatedAt
    }));

    // Calcular estatísticas
    const [total_users, active_users, inactive_users, admins, managers, regular_users] = await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ATIVO' } }),
        prisma.user.count({ where: { status: 'INATIVO' } }),
        prisma.user.count({ where: { perfil: 'ADMIN' } }),
        prisma.user.count({ where: { perfil: 'GESTOR' } }),
        prisma.user.count({ where: { perfil: 'USUARIO' } })
    ]);

    res.json({
      users: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      stats: {
        total_users,
        active_users,
        inactive_users,
        suspended_users: 0, // O schema não tem 'Suspenso'
        admins,
        managers,
        regular_users
      },
      filters: { search, role, department, status }
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/users/:id - Buscar usuário específico
router.get('/:id', requirePermission('all'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        perfil: true,
        status: true,
        foto: true,
        createdAt: true,
        updatedAt: true,
        departamento: {
          select: { id: true, nome: true }
        },
        _count: {
          select: { feedbacksCriados: true, feedbacksRecebidos: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Formatar a resposta para ser consistente com o frontend
    const formattedUser = {
      id: user.id,
      name: user.nome,
      email: user.email,
      role: user.perfil.charAt(0) + user.perfil.slice(1).toLowerCase(),
      department: user.departamento?.nome || null,
      position: user.cargo,
      status: user.status.charAt(0) + user.status.slice(1).toLowerCase(),
      avatar_url: user.foto,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      stats: {
        sent_feedbacks: user._count.feedbacksCriados,
        received_feedbacks: user._count.feedbacksRecebidos,
        total_feedbacks: user._count.feedbacksCriados + user._count.feedbacksRecebidos,
        avg_rating: null // O schema atual não suporta uma média de rating simples
      },
      teams: user.departamento ? [{ id: user.departamento.id, name: user.departamento.nome, description: '', member_role: 'Membro' }] : [] // Simula a estrutura de 'teams'
    };

    res.json({ user: formattedUser });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/users - Criar novo usuário
router.post('/', requirePermission('all'), auditLog('CREATE_USER', 'users'), async (req, res) => {
  try {
    // Validar dados de entrada com o schema atualizado
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => detail.message)
      });
    }

    const { nome, email, departamentoId, cargo, perfil, status } = value;

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Email já cadastrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Verificar se o departamento existe
    const departmentExists = await prisma.department.findUnique({ where: { id: departamentoId } });
    if (!departmentExists) {
        return res.status(400).json({ error: 'Departamento não encontrado', code: 'DEPARTMENT_NOT_FOUND' });
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Inserir usuário com Prisma
    const newUser = await prisma.user.create({
      data: {
        nome,
        email,
        senha: hashedPassword,
        cargo,
        perfil,
        status,
        departamento: {
          connect: { id: departamentoId }
        }
      },
      select: { id: true, nome: true, email: true, perfil: true, cargo: true, status: true, createdAt: true }
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: newUser,
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
      note: 'Em produção, a senha temporária deve ser enviada por email'
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', requirePermission('all'), auditLog('UPDATE_USER', 'users', 'id'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validar dados de entrada
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => detail.message)
      });
    }

    const { nome, email, departamentoId, cargo, perfil, status } = value;

    // Verificar se o email já existe em outro usuário
    const emailCheck = await prisma.user.findFirst({
      where: { email, id: { not: id } }
    });
    if (emailCheck) {
      return res.status(409).json({ error: 'Email já cadastrado', code: 'EMAIL_EXISTS' });
    }

    // Verificar se o departamento existe
    const departmentExists = await prisma.department.findUnique({ where: { id: departamentoId } });
    if (!departmentExists) {
        return res.status(400).json({ error: 'Departamento não encontrado', code: 'DEPARTMENT_NOT_FOUND' });
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        nome,
        email,
        cargo,
        perfil,
        status,
        departamento: {
          connect: { id: departamentoId }
        }
      },
      select: { id: true, nome: true, email: true, perfil: true, cargo: true, status: true, updatedAt: true }
    });

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });

  } catch (error) {
    // Tratar erro caso o usuário a ser atualizado não exista
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    }
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/users/:id - Desativar usuário (soft delete)
router.delete('/:id', requirePermission('all'), auditLog('DEACTIVATE_USER', 'users', 'id'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário existe
    const userToDeactivate = await prisma.user.findUnique({ where: { id } });

    if (!userToDeactivate) {
      return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    }

    // Não permitir desativar o último administrador ativo
    if (userToDeactivate.perfil === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { perfil: 'ADMIN', status: 'ATIVO' }
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Não é possível desativar o último administrador ativo',
          code: 'LAST_ADMIN'
        });
      }
    }

    // Desativar usuário (soft delete)
    await prisma.user.update({
      where: { id },
      data: { status: 'INATIVO' }
    });

    res.json({
      message: 'Usuário desativado com sucesso',
      userId: id
    });

  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/users/:id/activate - Reativar usuário
router.post('/:id/activate', requirePermission('all'), auditLog('ACTIVATE_USER', 'users', 'id'), async (req, res) => {
  try {
    const { id } = req.params;

    // Reativar usuário usando Prisma
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: 'ATIVO' },
      select: { id: true, nome: true, email: true, perfil: true, status: true, updatedAt: true }
    });

    res.json({
      message: 'Usuário reativado com sucesso',
      user: updatedUser
    });

  } catch (error) {
    // Tratar erro caso o usuário a ser atualizado não exista
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    }
    console.error('Erro ao reativar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/users/:id/reset-password - Resetar senha do usuário
router.post('/:id/reset-password', requirePermission('all'), auditLog('RESET_USER_PASSWORD', 'users', 'id'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar dados de entrada
    const { error, value } = adminPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => detail.message)
      });
    }

    const { password } = value;

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Alterar senha com Prisma
    await prisma.user.update({
      where: { id },
      data: { senha: hashedPassword }
    });

    res.json({
      message: 'Senha do usuário alterada com sucesso',
      userId: id
    });

  } catch (error) {
    // Tratar erro caso o usuário a ser atualizado não exista
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    }
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/users/profile/me - Perfil do usuário logado
router.get('/profile/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        perfil: true,
        status: true,
        foto: true,
        createdAt: true,
        updatedAt: true,
        departamento: { select: { nome: true } },
        _count: {
          select: { feedbacksCriados: true, feedbacksRecebidos: true, notificacoes: { where: { lida: false } } }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    }

    // Formatar a resposta para ser consistente com o frontend
    const formattedUser = {
      id: user.id,
      name: user.nome,
      email: user.email,
      role: user.perfil.charAt(0) + user.perfil.slice(1).toLowerCase(),
      department: user.departamento?.nome || null,
      position: user.cargo,
      status: user.status.charAt(0) + user.status.slice(1).toLowerCase(),
      avatar_url: user.foto,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      stats: {
        sent_feedbacks: user._count.feedbacksCriados,
        received_feedbacks: user._count.feedbacksRecebidos,
        total_feedbacks: user._count.feedbacksCriados + user._count.feedbacksRecebidos,
        avg_rating: null // O schema atual não suporta uma média de rating simples
      },
      unreadNotifications: user._count.notificacoes
    };

    res.json({ user: formattedUser });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/users/profile/me - Atualizar perfil do usuário logado
router.put('/profile/me', auditLog('UPDATE_OWN_PROFILE', 'users', 'id'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Validar dados de entrada (sem role e status)
    const profileSchema = Joi.object({
      nome: Joi.string().min(2).max(100).required(),
      departamentoId: Joi.string().uuid().required(),
      cargo: Joi.string().required()
    });

    const { error, value } = profileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => detail.message)
      });
    }

    const { nome, departamentoId, cargo } = value;

    // Verificar se o departamento existe
    const departmentExists = await prisma.department.findUnique({ where: { id: departamentoId } });
    if (!departmentExists) {
        return res.status(400).json({ error: 'Departamento não encontrado', code: 'DEPARTMENT_NOT_FOUND' });
    }

    // Atualizar perfil com Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nome,
        cargo,
        departamento: {
          connect: { id: departamentoId }
        }
      },
      select: { id: true, nome: true, email: true, perfil: true, cargo: true, status: true, updatedAt: true }
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });

  } catch (error) {
    // Tratar erro caso o usuário a ser atualizado não exista
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    }
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/users/departments - Listar departamentos
router.get('/departments/list', requirePermission('all'), async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' }
    });

    res.json({ departments });

  } catch (error) {
    console.error('Erro ao listar departamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/users/roles - Listar perfis
router.get('/roles/list', requirePermission('all'), async (req, res) => {
  try {
    const roles = Object.values(prisma.Role);
    res.json({ roles });

  } catch (error) {
    console.error('Erro ao listar perfis:', error);
    res.status(500).json({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
