import packageJson from "../../package.json";

export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION ?? packageJson.version;
}

export function getBuildRevision(): string | null {
  const sha = process.env.NEXT_PUBLIC_BUILD_SHA?.trim();
  if (!sha || sha === "unknown") {
    return null;
  }
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

export function getAppVersionLabel(): string {
  const version = getAppVersion();
  const revision = getBuildRevision();
  return revision ? `v${version} · ${revision}` : `v${version}`;
}

export function parseSemver(version: string): [number, number, number] {
  const normalized = version.trim().replace(/^v/, "");
  const [major, minor, patch] = normalized.split(".").map((part) => Number.parseInt(part, 10));
  return [
    Number.isFinite(major) ? major : 0,
    Number.isFinite(minor) ? minor : 0,
    Number.isFinite(patch) ? patch : 0,
  ];
}

export function isNewerSemver(latest: string, current: string): boolean {
  const [lMajor, lMinor, lPatch] = parseSemver(latest);
  const [cMajor, cMinor, cPatch] = parseSemver(current);

  if (lMajor !== cMajor) return lMajor > cMajor;
  if (lMinor !== cMinor) return lMinor > cMinor;
  return lPatch > cPatch;
}
