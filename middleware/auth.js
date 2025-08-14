const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ error: 'Token não fornecido', code: 'TOKEN_MISSING' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado', code: 'TOKEN_INVALID' });
    }
    req.user = user; // user will contain { userId, role, iat, exp }
    next();
  });
};

// Middleware to check for required permissions
const requirePermission = (requiredPermissions) => {
  return async (req, res, next) => {
    if (!Array.isArray(requiredPermissions)) {
        requiredPermissions = [requiredPermissions];
    }

    const userRole = req.user.role;

    if (!requiredPermissions.includes(userRole)) {
        return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.', code: 'ACCESS_DENIED' });
    }
    
    next();
  };
};

// Placeholder for audit logging
const auditLog = (action, targetEntity, targetIdentifierField) => {
    return (req, res, next) => {
        // This is a stub. Implement actual logging logic here if needed.
        console.log(`Audit Log: User ${req.user ? req.user.userId : 'Guest'} performed ${action} on ${targetEntity}`);
        next();
    };
};

module.exports = { authenticateToken, requirePermission, auditLog };
