-- AlterTable
ALTER TABLE "server_snapshot" ADD COLUMN "interfaceOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];
