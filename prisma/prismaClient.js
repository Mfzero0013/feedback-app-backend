const { PrismaClient } = require('@prisma/client');
// Criação da instância do Prisma Client
const prisma = new PrismaClient();
// Exportando para que possa ser utilizado em outros arquivos
module.exports = prisma;