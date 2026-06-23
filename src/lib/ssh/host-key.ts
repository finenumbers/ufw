import { createHash } from "crypto";

import type { SyncHostFingerprintVerifier } from "ssh2";

export function formatHostKeyFingerprint(key: Buffer): string {
  const digest = createHash("sha256").update(key).digest("base64");
  return `SHA256:${digest.replace(/=+$/, "")}`;
}

export function createHostKeyVerifier(expectedFingerprint?: string | null): {
  verifier: SyncHostFingerprintVerifier;
  getCaptured: () => string | null;
} {
  let capturedFingerprint: string | null = null;

  const verifier: SyncHostFingerprintVerifier = (fingerprint: string) => {
    if (!expectedFingerprint) {
      capturedFingerprint = fingerprint;
      return true;
    }

    return fingerprint === expectedFingerprint;
  };

  return {
    verifier,
    getCaptured: () => capturedFingerprint,
  };
}
