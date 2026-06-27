/** Maximum import file size (5 MiB). */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

/** Maximum rows accepted from a single import parse. */
export const MAX_IMPORT_ROWS = 10_000;

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
