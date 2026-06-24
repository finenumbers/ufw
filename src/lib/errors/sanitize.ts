import { createChildLogger } from "@/lib/logger";

const log = createChildLogger("errors");

export function sanitizeSshClientError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown SSH error";
  log.warn({ err: message }, "SSH client error");

  if (message.toLowerCase().includes("host key")) {
    return "SSH host key verification failed. The server key may have changed.";
  }

  if (message.toLowerCase().includes("authentication")) {
    return "SSH authentication failed. Check credentials and server access.";
  }

  if (message.toLowerCase().includes("timed out") || message.toLowerCase().includes("timeout")) {
    return "SSH connection timed out. Check host, port, and network access.";
  }

  return "SSH connection failed. Check host, credentials, and network access.";
}

export function sanitizeSshCommandError(stderr: string | null | undefined): string {
  const message = stderr?.trim();
  if (!message) {
    return "SSH command failed";
  }

  log.warn({ stderr: message }, "SSH command error");
  return "SSH command failed on the remote server.";
}

export function sanitizeApplyClientError(errors: string[]): string {
  if (errors.length === 0) {
    return "Apply failed";
  }

  log.warn({ errors }, "Apply execution errors");
  return "One or more UFW commands failed on the remote server. Review operations history for details.";
}

export function sanitizeGenericClientError(
  error: unknown,
  fallback: string,
): string {
  const message = error instanceof Error ? error.message : fallback;
  log.warn({ err: message }, "Client-facing error sanitized");
  return fallback;
}

export function sanitizeConfigImportError(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.startsWith("Invalid") ||
      error.message.startsWith("Unsupported") ||
      error.message.startsWith("Duplicate") ||
      error.message.startsWith("Unknown identity") ||
      error.message.startsWith("Cannot import")
    ) {
      return error.message;
    }
  }

  log.error({ err: error }, "Config import failed");
  return "Configuration import failed";
}

export function sanitizeExportError(error: unknown): string {
  log.error({ err: error }, "Config export failed");
  return "Configuration export failed";
}
