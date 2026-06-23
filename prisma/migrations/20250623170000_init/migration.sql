-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('PASSWORD', 'PRIVATE_KEY', 'PRIVATE_KEY_WITH_PASSPHRASE');
CREATE TYPE "RuleAction" AS ENUM ('ALLOW', 'DENY', 'REJECT', 'LIMIT');
CREATE TYPE "RuleDirection" AS ENUM ('IN', 'OUT', 'ROUTE');
CREATE TYPE "RuleProtocol" AS ENUM ('TCP', 'UDP', 'ICMP', 'ANY');
CREATE TYPE "LogMode" AS ENUM ('NONE', 'LOG', 'LOG_ALL');
CREATE TYPE "RuleOriginState" AS ENUM ('MATCHED', 'REMOTE_ONLY', 'LOCAL_ONLY', 'DRAFT_ONLY', 'CONFLICT');
CREATE TYPE "OperationStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED');
CREATE TYPE "ApplyItemAction" AS ENUM ('ADD', 'REMOVE', 'UPDATE');
CREATE TYPE "AuditAction" AS ENUM ('SETUP_COMPLETED', 'SERVER_CREATED', 'SERVER_UPDATED', 'SERVER_DELETED', 'SSH_TEST', 'UFW_INSTALL', 'UFW_ENABLE', 'SNAPSHOT_LOADED', 'DRAFT_SAVED', 'RULES_IMPORTED', 'APPLY_PREVIEWED', 'APPLY_CONFIRMED', 'APPLY_COMPLETED', 'APPLY_FAILED', 'LOGIN', 'LOGOUT');
CREATE TYPE "TagKind" AS ENUM ('GROUP', 'NAME');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "server" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 22,
    "username" TEXT NOT NULL,
    "authMethod" "AuthMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "server_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "server_credential" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "server_credential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "server_snapshot" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "ufwInstalled" BOOLEAN NOT NULL,
    "ufwActive" BOOLEAN NOT NULL,
    "rawStatus" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "server_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "server_snapshot_rule" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "action" "RuleAction" NOT NULL,
    "direction" "RuleDirection",
    "interface" TEXT,
    "protocol" "RuleProtocol",
    "fromAddress" TEXT,
    "fromPort" TEXT,
    "toAddress" TEXT,
    "toPort" TEXT,
    "appName" TEXT,
    "logMode" "LogMode" NOT NULL DEFAULT 'NONE',
    "ruleComment" TEXT,
    "ipv6" BOOLEAN NOT NULL DEFAULT false,
    "rawLine" TEXT,
    CONSTRAINT "server_snapshot_rule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rule_record" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "action" "RuleAction" NOT NULL,
    "direction" "RuleDirection",
    "interface" TEXT,
    "protocol" "RuleProtocol",
    "fromAddress" TEXT,
    "fromPort" TEXT,
    "toAddress" TEXT,
    "toPort" TEXT,
    "appName" TEXT,
    "logMode" "LogMode" NOT NULL DEFAULT 'NONE',
    "ruleComment" TEXT,
    "ipv6" BOOLEAN NOT NULL DEFAULT false,
    "group" TEXT,
    "name" TEXT,
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rule_record_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "draft_session" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "draft_session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "draft_rule" (
    "id" TEXT NOT NULL,
    "draftSessionId" TEXT NOT NULL,
    "clientRowId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "action" "RuleAction" NOT NULL,
    "direction" "RuleDirection",
    "interface" TEXT,
    "protocol" "RuleProtocol",
    "fromAddress" TEXT,
    "fromPort" TEXT,
    "toAddress" TEXT,
    "toPort" TEXT,
    "appName" TEXT,
    "logMode" "LogMode" NOT NULL DEFAULT 'NONE',
    "ruleComment" TEXT,
    "ipv6" BOOLEAN NOT NULL DEFAULT false,
    "group" TEXT,
    "name" TEXT,
    "notes" TEXT,
    "originState" "RuleOriginState" NOT NULL DEFAULT 'DRAFT_ONLY',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "draft_rule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "apply_session" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'PENDING',
    "summary" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "apply_session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "apply_session_item" (
    "id" TEXT NOT NULL,
    "applySessionId" TEXT NOT NULL,
    "action" "ApplyItemAction" NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "remoteCommand" TEXT,
    "status" "OperationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "apply_session_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operation_log" (
    "id" TEXT NOT NULL,
    "serverId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "status" "OperationStatus" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "operation_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tag_value" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "kind" "TagKind" NOT NULL,
    "value" TEXT NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tag_value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
CREATE UNIQUE INDEX "server_host_port_username_key" ON "server"("host", "port", "username");
CREATE UNIQUE INDEX "server_credential_serverId_key" ON "server_credential"("serverId");
CREATE INDEX "server_snapshot_serverId_capturedAt_idx" ON "server_snapshot"("serverId", "capturedAt" DESC);
CREATE UNIQUE INDEX "server_snapshot_rule_snapshotId_fingerprint_key" ON "server_snapshot_rule"("snapshotId", "fingerprint");
CREATE INDEX "server_snapshot_rule_snapshotId_sortOrder_idx" ON "server_snapshot_rule"("snapshotId", "sortOrder");
CREATE UNIQUE INDEX "rule_record_serverId_fingerprint_key" ON "rule_record"("serverId", "fingerprint");
CREATE INDEX "rule_record_serverId_sortOrder_idx" ON "rule_record"("serverId", "sortOrder");
CREATE INDEX "draft_session_serverId_userId_isActive_idx" ON "draft_session"("serverId", "userId", "isActive");
CREATE INDEX "draft_rule_draftSessionId_sortOrder_idx" ON "draft_rule"("draftSessionId", "sortOrder");
CREATE INDEX "apply_session_serverId_createdAt_idx" ON "apply_session"("serverId", "createdAt" DESC);
CREATE INDEX "apply_session_item_applySessionId_sortOrder_idx" ON "apply_session_item"("applySessionId", "sortOrder");
CREATE INDEX "operation_log_serverId_createdAt_idx" ON "operation_log"("serverId", "createdAt" DESC);
CREATE INDEX "audit_event_createdAt_idx" ON "audit_event"("createdAt" DESC);
CREATE UNIQUE INDEX "tag_value_serverId_kind_value_key" ON "tag_value"("serverId", "kind", "value");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "server_credential" ADD CONSTRAINT "server_credential_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "server_snapshot" ADD CONSTRAINT "server_snapshot_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "server_snapshot_rule" ADD CONSTRAINT "server_snapshot_rule_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "server_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rule_record" ADD CONSTRAINT "rule_record_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "draft_session" ADD CONSTRAINT "draft_session_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "draft_session" ADD CONSTRAINT "draft_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "draft_rule" ADD CONSTRAINT "draft_rule_draftSessionId_fkey" FOREIGN KEY ("draftSessionId") REFERENCES "draft_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "apply_session" ADD CONSTRAINT "apply_session_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "apply_session" ADD CONSTRAINT "apply_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "apply_session_item" ADD CONSTRAINT "apply_session_item_applySessionId_fkey" FOREIGN KEY ("applySessionId") REFERENCES "apply_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_log" ADD CONSTRAINT "operation_log_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tag_value" ADD CONSTRAINT "tag_value_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
