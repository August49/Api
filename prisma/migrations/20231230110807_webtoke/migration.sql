/*
  Warnings:

  - The primary key for the `Authenticator` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `webAuthenToken` on the `User` table. All the data in the column will be lost.
  - Changed the type of `credentialId` on the `Authenticator` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Authenticator" DROP CONSTRAINT "Authenticator_pkey",
ADD COLUMN     "webAuthenToken" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "credentialId",
ADD COLUMN     "credentialId" BYTEA NOT NULL,
ADD CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("credentialId");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "webAuthenToken";
