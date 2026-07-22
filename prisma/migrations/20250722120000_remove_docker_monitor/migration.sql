-- Remove Docker monitor data and schema

DELETE FROM "audit_event" WHERE "action" IN (
  'DOCKER_INVENTORY_REFRESHED',
  'DOCKER_CONTAINER_STARTED',
  'DOCKER_CONTAINER_STOPPED',
  'DOCKER_CONTAINER_RESTARTED'
);

DELETE FROM "operation_log" WHERE "type" IN ('docker.inventory', 'docker.control');

DROP TABLE IF EXISTS "docker_container_record";
DROP TABLE IF EXISTS "docker_inventory_snapshot";

CREATE TYPE "AuditAction_new" AS ENUM (
  'SETUP_COMPLETED',
  'SERVER_CREATED',
  'SERVER_UPDATED',
  'SERVER_DELETED',
  'IDENTITY_CREATED',
  'IDENTITY_UPDATED',
  'IDENTITY_DELETED',
  'SSH_TEST',
  'UFW_INSTALL',
  'UFW_ENABLE',
  'SNAPSHOT_LOADED',
  'DRAFT_SAVED',
  'RULES_IMPORTED',
  'APPLY_PREVIEWED',
  'APPLY_CONFIRMED',
  'APPLY_COMPLETED',
  'APPLY_FAILED',
  'CONFIG_EXPORT',
  'OPERATIONS_CLEARED',
  'LOGIN',
  'LOGOUT',
  'PORT_SCAN_STARTED',
  'PORT_SCAN_COMPLETED'
);

ALTER TABLE "audit_event" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");

DROP TYPE "AuditAction";

ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
