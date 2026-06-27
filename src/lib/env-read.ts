export function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function readBoolEnv(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}
