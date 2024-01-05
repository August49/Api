/*
  Warnings:

  - You are about to drop the column `webAuthenToken` on the `Authenticator` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Authenticator" DROP COLUMN "webAuthenToken";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "webAuthenToken" BOOLEAN NOT NULL DEFAULT false;
