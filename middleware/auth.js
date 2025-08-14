const jwt = require('jsonwebtoken');

// Middleware para autenticar o token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ error: 'Token não fornecido', code: 'TOKEN_MISSING' });
  }

  // O payload do JWT, gerado no login, contém { userId, perfil, ... }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado', code: 'TOKEN_INVALID' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar as permissões necessárias
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!Array.isArray(requiredPermissions)) {
      requiredPermissions = [requiredPermissions];
    }

    // CORREÇÃO CRÍTICA: Usa 'perfil' do usuário, que vem do token JWT
    const userProfile = req.user.perfil;

    if (!requiredPermissions.includes(userProfile)) {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.', code: 'ACCESS_DENIED' });
    }

    next();
  };
};

// Placeholder para logs de auditoria
const auditLog = (action) => {
  return (req, res, next) => {
    // Lógica de log pode ser implementada aqui no futuro
    console.log(`Audit Log: User ${req.user ? req.user.userId : 'Guest'} performed ${action}`);
    next();
  };
};

module.exports = { authenticateToken, requirePermission, auditLog };
