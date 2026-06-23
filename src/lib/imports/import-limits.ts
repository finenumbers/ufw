/** Maximum import file size (5 MiB). */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export function assertImportFileSize(size: number): void {
  if (size > MAX_IMPORT_FILE_BYTES) {
    throw new Error(
      `Import file is too large (${Math.ceil(size / 1024)} KB). Maximum size is ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB.`,
    );
  }
}
