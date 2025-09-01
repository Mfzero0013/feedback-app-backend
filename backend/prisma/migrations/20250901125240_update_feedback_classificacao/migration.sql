/*
  Warnings:

  - You are about to drop the column `descricao` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Feedback` table. All the data in the column will be lost.
  - Added the required column `classificacao` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conteudo` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Classificacao" AS ENUM ('OTIMO', 'MEDIA', 'RUIM');

-- AlterTable
ALTER TABLE "public"."Feedback" DROP COLUMN "descricao",
DROP COLUMN "tipo",
ADD COLUMN     "classificacao" "public"."Classificacao" NOT NULL,
ADD COLUMN     "conteudo" TEXT NOT NULL;
