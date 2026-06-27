/** Maximum import file size (5 MiB). */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

/** Maximum rows accepted from a single import parse. */
export const MAX_IMPORT_ROWS = 10_000;

/** Maximum servers in a configuration import file. */
export const MAX_CONFIG_SERVERS = 500;

/** Maximum identities in a configuration import file. */
export const MAX_CONFIG_IDENTITIES = 100;

export function assertImportFileSize(size: number): void {
  if (size > MAX_IMPORT_FILE_BYTES) {
    throw new Error(
      `Import file is too large (${Math.ceil(size / 1024)} KB). Maximum size is ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB.`,
    );
  }
}

export function assertImportRowCount(count: number): void {
  if (count > MAX_IMPORT_ROWS) {
    throw new Error(
      `Import contains too many rows (${count}). Maximum is ${MAX_IMPORT_ROWS}.`,
    );
  }
}

export function assertConfigEntryCounts(identityCount: number, serverCount: number): void {
  if (identityCount > MAX_CONFIG_IDENTITIES) {
    throw new Error(
      `Configuration contains too many identities (${identityCount}). Maximum is ${MAX_CONFIG_IDENTITIES}.`,
    );
  }

  if (serverCount > MAX_CONFIG_SERVERS) {
    throw new Error(
      `Configuration contains too many servers (${serverCount}). Maximum is ${MAX_CONFIG_SERVERS}.`,
    );
  }
}
