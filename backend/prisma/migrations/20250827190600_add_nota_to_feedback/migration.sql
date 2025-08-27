-- AlterTable
ALTER TABLE "public"."Equipe" ADD COLUMN     "nota" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDENTE';
