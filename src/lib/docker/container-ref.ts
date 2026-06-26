const CONTAINER_ID_PATTERN = /^[a-f0-9]{12,64}$/i;
const CONTAINER_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,254}$/;

export function isValidContainerRef(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return CONTAINER_ID_PATTERN.test(trimmed) || CONTAINER_NAME_PATTERN.test(trimmed);
}

export function assertValidContainerRef(value: string): string {
  const trimmed = value.trim();
  if (!isValidContainerRef(trimmed)) {
    throw new Error("Invalid container reference");
  }
  return trimmed;
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
