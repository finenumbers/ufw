export function encodeServerAddress(host: string): string {
  return encodeURIComponent(host);
}

export function decodeServerAddress(address: string): string {
  return decodeURIComponent(address);
}

export function getServerPath(host: string, suffix = ""): string {
  const base = `/servers/${encodeServerAddress(host)}`;
  return suffix ? `${base}${suffix}` : base;
}

export function isServerPathActive(pathname: string, host: string): boolean {
  const base = getServerPath(host);
  return pathname === base || pathname.startsWith(`${base}/`);
}
