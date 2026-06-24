-- SSH identities: migrate credentials from server_credential to ssh_identity

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'IDENTITY_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'IDENTITY_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'IDENTITY_DELETED';

-- CreateTable
CREATE TABLE "ssh_identity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "authMethod" "AuthMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ssh_identity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ssh_identity_credential" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ssh_identity_credential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ssh_identity_name_key" ON "ssh_identity"("name");
CREATE UNIQUE INDEX "ssh_identity_credential_identityId_key" ON "ssh_identity_credential"("identityId");

ALTER TABLE "ssh_identity_credential" ADD CONSTRAINT "ssh_identity_credential_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "ssh_identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "server" ADD COLUMN "identityId" TEXT;

-- Migrate existing server credentials into identities (one identity per server)
INSERT INTO "ssh_identity" ("id", "name", "username", "authMethod", "createdAt", "updatedAt")
SELECT
    'migr_' || s."id",
    s."name" || ' (' || s."username" || '@' || s."host" || ')',
    s."username",
    s."authMethod",
    s."createdAt",
    s."updatedAt"
FROM "server" s
INNER JOIN "server_credential" sc ON sc."serverId" = s."id";

INSERT INTO "ssh_identity_credential" ("id", "identityId", "encryptedData", "iv", "authTag", "keyVersion", "createdAt", "updatedAt")
SELECT
    'migr_cred_' || s."id",
    'migr_' || s."id",
    sc."encryptedData",
    sc."iv",
    sc."authTag",
    sc."keyVersion",
    sc."createdAt",
    sc."updatedAt"
FROM "server" s
INNER JOIN "server_credential" sc ON sc."serverId" = s."id";

UPDATE "server" s
SET "identityId" = 'migr_' || s."id"
WHERE EXISTS (
    SELECT 1 FROM "server_credential" sc WHERE sc."serverId" = s."id"
);

-- Servers without credentials (should not exist) would block NOT NULL; fail migration if any
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "server" WHERE "identityId" IS NULL) THEN
    RAISE EXCEPTION 'Migration failed: server rows without credentials remain';
  END IF;
END $$;

ALTER TABLE "server" ALTER COLUMN "identityId" SET NOT NULL;

ALTER TABLE "server" DROP CONSTRAINT IF EXISTS "server_host_port_username_key";
DROP TABLE "server_credential";

ALTER TABLE "server" DROP COLUMN "username";
ALTER TABLE "server" DROP COLUMN "authMethod";

CREATE UNIQUE INDEX "server_host_port_identityId_key" ON "server"("host", "port", "identityId");

ALTER TABLE "server" ADD CONSTRAINT "server_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "ssh_identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
