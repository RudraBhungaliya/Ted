/*
  Warnings:

  - You are about to drop the column `speaker` on the `Transcript` table. All the data in the column will be lost.
  - You are about to drop the `AnswerAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `speakerName` to the `Transcript` table without a default value. This is not possible if the table is not empty.
  - Added the required column `speakerType` to the `Transcript` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('INTERVIEW', 'MEETING');

-- CreateEnum
CREATE TYPE "SpeakerType" AS ENUM ('USER', 'PARTICIPANT', 'AI');

-- DropForeignKey
ALTER TABLE "AnswerAnalytics" DROP CONSTRAINT "AnswerAnalytics_sessionId_fkey";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "mode" "SessionMode" NOT NULL DEFAULT 'INTERVIEW';

-- AlterTable
ALTER TABLE "Transcript" DROP COLUMN "speaker",
ADD COLUMN     "speakerName" TEXT NOT NULL,
ADD COLUMN     "speakerType" "SpeakerType" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "AnswerAnalytics";

-- CreateTable
CREATE TABLE "SessionAnalytics" (
    "sessionId" TEXT NOT NULL,
    "totalWords" INTEGER NOT NULL DEFAULT 0,
    "fillerCount" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" INTEGER,
    "communicationScore" INTEGER,
    "technicalScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAnalytics_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "SessionSummary" (
    "sessionId" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "keyPoints" TEXT[],
    "actionItems" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionSummary_pkey" PRIMARY KEY ("sessionId")
);

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Transcript_sessionId_idx" ON "Transcript"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "SessionAnalytics" ADD CONSTRAINT "SessionAnalytics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSummary" ADD CONSTRAINT "SessionSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
