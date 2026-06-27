import assert from "node:assert/strict";
import test from "node:test";

import { validateProductionEnv } from "@/lib/env-validation";

const REQUIRED_ENV = {
  BETTER_AUTH_SECRET: "test-auth-secret-with-enough-length",
  APP_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  APP_URL: "https://ufw.example.com",
};

function withProductionEnv(
  overrides: Record<string, string | undefined>,
  fn: () => void,
): void {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousKeys = Object.keys({ ...REQUIRED_ENV, ...overrides });
  const saved: Record<string, string | undefined> = {};

  for (const key of previousKeys) {
    saved[key] = process.env[key];
  }

  process.env.NODE_ENV = "production";
  for (const [key, value] of Object.entries({ ...REQUIRED_ENV, ...overrides })) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    fn();
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    for (const key of previousKeys) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  }
}

test("validateProductionEnv accepts HTTPS APP_URL and long auth secret", () => {
  withProductionEnv({}, () => {
    assert.doesNotThrow(() => validateProductionEnv());
  });
});

test("validateProductionEnv rejects HTTP APP_URL in production", () => {
  withProductionEnv({ APP_URL: "http://ufw.example.com" }, () => {
    assert.throws(() => validateProductionEnv(), /HTTPS/);
  });
});

test("validateProductionEnv allows HTTP APP_URL on localhost for docker dev and CI", () => {
  withProductionEnv({ APP_URL: "http://localhost:8088" }, () => {
    assert.doesNotThrow(() => validateProductionEnv());
  });
});

test("validateProductionEnv rejects short BETTER_AUTH_SECRET", () => {
  withProductionEnv({ BETTER_AUTH_SECRET: "short" }, () => {
    assert.throws(() => validateProductionEnv(), /BETTER_AUTH_SECRET must be at least/);
  });
});
