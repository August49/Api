-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MANAGER', 'EMPLOYEE', 'DB_ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
