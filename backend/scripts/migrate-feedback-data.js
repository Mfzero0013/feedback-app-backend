const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration...');

  // First, add the new columns as optional
  try {
    await prisma.$executeRaw`ALTER TABLE "Feedback" ADD COLUMN "conteudo" TEXT;`;
    await prisma.$executeRaw`ALTER TABLE "Feedback" ADD COLUMN "classificacao" TEXT;`;
    console.log('Columns "conteudo" and "classificacao" added successfully.');
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log('Columns already exist, skipping creation.');
    } else {
      console.error('Error adding columns:', e);
      throw e;
    }
  }

  // Migrate data from 'descricao' to 'conteudo'
  await prisma.$executeRaw`UPDATE "Feedback" SET "conteudo" = "descricao" WHERE "conteudo" IS NULL;`;
  console.log('Data migrated from "descricao" to "conteudo".');

  // Migrate data from 'tipo' to 'classificacao'
  await prisma.$executeRaw`UPDATE "Feedback" SET "classificacao" = 'OTIMO' WHERE "tipo" = 'ELOGIO' AND "classificacao" IS NULL;`;
  await prisma.$executeRaw`UPDATE "Feedback" SET "classificacao" = 'MEDIA' WHERE "tipo" = 'SUGESTAO' AND "classificacao" IS NULL;`;
  await prisma.$executeRaw`UPDATE "Feedback" SET "classificacao" = 'RUIM' WHERE "tipo" = 'CRITICA' AND "classificacao" IS NULL;`;
  console.log('Data migrated from "tipo" to "classificacao".');

  console.log('Data migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
