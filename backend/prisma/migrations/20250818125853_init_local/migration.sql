/*
  Warnings:

  - You are about to drop the column `departamentoId` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `departamentoId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `perfil` on the `User` table. All the data in the column will be lost.
  - The `cargo` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `tipoId` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Cargo" AS ENUM ('COLABORADOR', 'GESTOR', 'ADMINISTRADOR');

-- DropForeignKey
ALTER TABLE "public"."Department" DROP CONSTRAINT "Department_gestorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Feedback" DROP CONSTRAINT "Feedback_departamentoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_departamentoId_fkey";

-- AlterTable
ALTER TABLE "public"."Feedback" DROP COLUMN "departamentoId",
DROP COLUMN "tipo",
ADD COLUMN     "equipeId" TEXT,
ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "tipoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "departamentoId",
DROP COLUMN "perfil",
ADD COLUMN     "equipeId" TEXT,
DROP COLUMN "cargo",
ADD COLUMN     "cargo" "public"."Cargo" NOT NULL DEFAULT 'COLABORADOR';

-- DropTable
DROP TABLE "public"."Department";

-- DropEnum
DROP TYPE "public"."FeedbackType";

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateTable
CREATE TABLE "public"."Equipe" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "gestorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeedbackType" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_nome_key" ON "public"."Equipe"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_gestorId_key" ON "public"."Equipe"("gestorId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackType_nome_key" ON "public"."FeedbackType"("nome");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "public"."Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Equipe" ADD CONSTRAINT "Equipe_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feedback" ADD CONSTRAINT "Feedback_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "public"."Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feedback" ADD CONSTRAINT "Feedback_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "public"."FeedbackType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
