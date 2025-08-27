/*
  Warnings:

  - You are about to drop the column `tipoId` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the `FeedbackType` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `tipo` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Feedback" DROP CONSTRAINT "Feedback_tipoId_fkey";

-- AlterTable
ALTER TABLE "public"."Feedback" DROP COLUMN "tipoId",
ADD COLUMN     "tipo" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."FeedbackType";
