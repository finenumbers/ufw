ALTER TYPE "AuditAction" ADD VALUE 'AWG_CONFIG_APPLIED';
ALTER TYPE "AuditAction" ADD VALUE 'AWG_DISCONNECTED';
ALTER TYPE "AuditAction" ADD VALUE 'AWG_CONFIG_DELETED';

ALTER TABLE "server" ADD COLUMN "useAwg" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "amnezia_wg_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "address" TEXT NOT NULL,
    "endpointHost" TEXT NOT NULL,
    "endpointPort" INTEGER NOT NULL,
    "allowedIps" TEXT NOT NULL,
    "peerPublicKey" TEXT NOT NULL,
    "mtu" INTEGER NOT NULL,
    "keepalive" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "encryptedData" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amnezia_wg_config_pkey" PRIMARY KEY ("id")
);
