const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

const connectDatabase = async () => {
  try {
    if (!prisma) {
      prisma = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Log database queries in development
      if (process.env.NODE_ENV === 'development') {
        prisma.$on('query', (e) => {
          logger.debug('Query: ' + e.query);
          logger.debug('Params: ' + e.params);
          logger.debug('Duration: ' + e.duration + 'ms');
        });
      }

      prisma.$on('error', (e) => {
        logger.error('Database error:', e);
      });

      prisma.$on('warn', (e) => {
        logger.warn('Database warning:', e);
      });

      prisma.$on('info', (e) => {
        logger.info('Database info:', e);
      });

      // Test the connection
      await prisma.$connect();
      logger.info('✅ Conectado ao banco de dados PostgreSQL');
    }

    return prisma;
  } catch (error) {
    logger.error('❌ Erro ao conectar com o banco de dados:', error);
    throw error;
  }
};

const disconnectDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Desconectado do banco de dados');
  }
};

const getPrismaClient = () => {
  if (!prisma) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return prisma;
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getPrismaClient,
};
