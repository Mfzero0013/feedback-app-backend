const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/AppError');

// Promisify do jwt.verify para usar async/await
const verifyToken = promisify(jwt.verify);

// Middleware para autenticar o token JWT
const authenticateToken = async (req, res, next) => {
  try {
    // 1) Verifica se o token existe
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError(
        'Você não está logado. Por favor, faça o login para obter acesso.',
        401,
        'UNAUTHENTICATED'
      ));
    }

    // 2) Verifica se o token é válido
    const decoded = await verifyToken(token, process.env.JWT_SECRET);

    // 3) Verifica se o usuário ainda existe (opcional)
    // Aqui você pode adicionar uma verificação no banco de dados
    // se o usuário ainda existe e está ativo

    // 4) Salva o usuário no request para uso posterior
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(
        'Token inválido. Por favor, faça login novamente.',
        401,
        'TOKEN_INVALID'
      ));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(
        'Sua sessão expirou. Por favor, faça login novamente.',
        401,
        'TOKEN_EXPIRED'
      ));
    }
    return next(error);
  }
};

// Middleware para verificar as permissões necessárias
const requirePermission = (requiredPermissions) => (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError(
        'Acesso negado: autenticação necessária.',
        401,
        'UNAUTHENTICATED'
      ));
    }

    const userPermission = req.user.cargo;
    const permissionsArray = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    if (!permissionsArray.includes(userPermission)) {
      return next(new AppError(
        'Acesso negado: permissão insuficiente.',
        403,
        'FORBIDDEN'
      ));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware de logs de auditoria
const auditLog = (action) => {
  return (req, res, next) => {
    try {
      const userId = req.user?.userId || 'Guest';
      const timestamp = new Date().toISOString();
      const method = req.method;
      const url = req.originalUrl;
      const ip = req.ip || req.connection.remoteAddress;

      // Formato estruturado para logs
      const logMessage = JSON.stringify({
        timestamp,
        userId,
        action,
        method,
        url,
        ip,
        userAgent: req.get('user-agent')
      });

      // Aqui você pode substituir por um serviço de log como Winston
      console.log(`[AUDIT] ${logMessage}`);
      
      // Se estiver em produção, você pode querer enviar para um serviço de log
      // logger.info(logMessage);
      
      next();
    } catch (error) {
      // Não interrompe o fluxo da aplicação se o log falhar
      console.error('Erro ao registrar log de auditoria:', error);
      next();
    }
  };
};

module.exports = { 
  authenticateToken, 
  requirePermission, 
  auditLog 
};
