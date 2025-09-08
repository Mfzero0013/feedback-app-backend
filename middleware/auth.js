const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// Middleware para autenticar o token JWT
const authenticateToken = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Você não está logado. Por favor, faça o login para obter acesso.', 401, 'UNAUTHENTICATED'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new AppError('Token inválido ou expirado. Por favor, faça login novamente.', 403, 'TOKEN_INVALID'));
    }
    req.user = decoded;
    next();
  });
};

// Middleware para verificar as permissões necessárias
<<<<<<< HEAD
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!Array.isArray(requiredPermissions)) {
      requiredPermissions = [requiredPermissions];
    }

    // CORREÇÃO CRÍTICA: Usa 'perfil' do usuário, que vem do token JWT
    const userProfile = req.user.cargo;

    if (!requiredPermissions.includes(userProfile)) {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.', code: 'ACCESS_DENIED' });
    }

    next();
  };
=======
const requirePermission = (requiredPermissions) => (req, res, next) => {
    const userPermission = req.user?.cargo;
    // Garante que requiredPermissions seja sempre um array para simplificar a lógica
    const permissionsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    // Se o usuário tiver uma das permissões necessárias, continua
    if (userPermission && permissionsArray.includes(userPermission)) {
        return next();
    }

    // Se não, retorna um erro de acesso negado
    return next(new AppError('Acesso negado: permissão insuficiente.', 403));
>>>>>>> ba508e88f0c67f5523382fe5ed8f61e1c86f97c6
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
