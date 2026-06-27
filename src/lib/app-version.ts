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
