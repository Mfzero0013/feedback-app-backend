const { PrismaClient } = require('@prisma/client');

// Instancia o Prisma Client para ser usado em toda a aplicação.
// Isso evita a criação de múltiplas conexões com o banco de dados.
const prisma = new PrismaClient();

module.exports = prisma;
