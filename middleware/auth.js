const jwt = require('jsonwebtoken');
const { runSelectOne, runQuery } = require('../config/database');

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'feedbackhub-secret-key-2024';

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso não fornecido',
      code: 'TOKEN_MISSING'
    });
  }
  
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ 
        error: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    }
    
    try {
      // Verificar se o usuário ainda existe e está ativo
      const user = await runSelectOne(
        'SELECT id, name, email, role, department, position, status FROM users WHERE id = $1 AND status = $2',
        [decoded.userId, 'Ativo']
      );
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Usuário não encontrado ou inativo',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Adicionar informações do usuário ao request
      req.user = user;
      next();
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      return res.status(500).json({ 
        error: 'Erro interno ao verificar usuário',
        code: 'INTERNAL_ERROR'
      });
    }
  });
}

// Middleware para verificar permissões específicas
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }
    
    // Administradores têm acesso total
    if (req.user.role === 'Administrador') {
      return next();
    }
    
    // Verificar permissões baseadas no papel
    const userPermissions = getUserPermissions(req.user.role);
    
    if (userPermissions.includes(permission) || userPermissions.includes('all')) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Acesso negado. Permissão insuficiente.',
      code: 'INSUFFICIENT_PERMISSIONS',
      required: permission,
      userRole: req.user.role
    });
  };
}

// Middleware para verificar se o usuário é o próprio ou tem permissão administrativa
function requireOwnershipOrAdmin(tableName, idField = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }
    
    // Administradores têm acesso total
    if (req.user.role === 'Administrador') {
      return next();
    }
    
    // Gestores podem acessar recursos da sua equipe
    if (req.user.role === 'Gestor') {
      // Verificar se o recurso pertence à equipe do gestor
      try {
        const resource = await runSelectOne(
          `SELECT * FROM ${tableName} WHERE ${idField} = $1`,
          [req.params[idField] || req.body[idField]]
        );
        
        if (!resource) {
          return res.status(404).json({ 
            error: 'Recurso não encontrado',
            code: 'RESOURCE_NOT_FOUND'
          });
        }
        
        // Se for um feedback, verificar se o gestor é o remetente ou destinatário
        if (tableName === 'feedbacks') {
          if (resource.from_user_id === req.user.id || resource.to_user_id === req.user.id) {
            return next();
          }
          
          // Verificar se o gestor gerencia a equipe do usuário
          const isTeamManager = await runSelectOne(
            `SELECT tm.* FROM team_members tm 
             JOIN teams t ON tm.team_id = t.id 
             WHERE t.manager_id = $1 AND tm.user_id = $2`,
            [req.user.id, resource.to_user_id]
          );
          
          if (isTeamManager) {
            return next();
          }
        }
        
        // Para outros recursos, verificar se o gestor é o proprietário
        if (resource.user_id === req.user.id || resource.manager_id === req.user.id) {
          return next();
        }
      } catch (error) {
        console.error('Erro ao verificar propriedade:', error);
        return res.status(500).json({ 
          error: 'Erro interno ao verificar permissões',
          code: 'INTERNAL_ERROR'
        });
      }
    }
    
    // Usuários comuns só podem acessar seus próprios recursos
    try {
      const resource = await runSelectOne(
        `SELECT * FROM ${tableName} WHERE ${idField} = $1`,
        [req.params[idField] || req.body[idField]]
      );
      
      if (!resource) {
        return res.status(404).json({ 
          error: 'Recurso não encontrado',
          code: 'RESOURCE_NOT_FOUND'
        });
      }
      
      // Verificar se o usuário é o proprietário do recurso
      if (resource.user_id === req.user.id || 
          resource.from_user_id === req.user.id || 
          resource.to_user_id === req.user.id) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Acesso negado. Você só pode acessar seus próprios recursos.',
        code: 'ACCESS_DENIED'
      });
    } catch (error) {
      console.error('Erro ao verificar propriedade:', error);
      return res.status(500).json({ 
        error: 'Erro interno ao verificar permissões',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

// Função para gerar token JWT
function generateToken(userId, role) {
  const payload = {
    userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

// Função para obter permissões baseadas no papel
function getUserPermissions(role) {
  const permissions = {
    'Administrador': ['all'],
    'Gestor': ['team', 'reports', 'feedback', 'profile', 'notifications'],
    'Usuário': ['feedback', 'profile', 'notifications']
  };
  
  return permissions[role] || [];
}

// Middleware para logging de auditoria
function auditLog(action, tableName = null, recordId = null) {
  return async (req, res, next) => {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Log da ação após a resposta ser enviada
      setTimeout(async () => {
        try {
          const oldValues = req.method === 'PUT' || req.method === 'DELETE' ? JSON.stringify(req.body) : null;
          const newValues = req.method === 'POST' || req.method === 'PUT' ? JSON.stringify(req.body) : null;
          
          await runQuery(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              req.user?.id || null,
              action,
              tableName,
              recordId,
              oldValues,
              newValues,
              req.ip,
              req.get('User-Agent')
            ]
          );
        } catch (error) {
          console.error('Erro ao registrar log de auditoria:', error);
        }
      }, 100);
      
      originalSend.call(this, data);
    };
    
    next();
  };
}

module.exports = {
  authenticateToken,
  requirePermission,
  requireOwnershipOrAdmin,
  generateToken,
  getUserPermissions,
  auditLog,
  JWT_SECRET
};
