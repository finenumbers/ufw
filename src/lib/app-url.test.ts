import assert from "node:assert/strict";
import test from "node:test";

import { getPublicAppUrl } from "@/lib/app-url";

test("getPublicAppUrl prefers APP_URL over BETTER_AUTH_URL", () => {
  const previousAppUrl = process.env.APP_URL;
  const previousBetterAuthUrl = process.env.BETTER_AUTH_URL;

  process.env.APP_URL = "https://ufw.example.com";
  process.env.BETTER_AUTH_URL = "https://ignored.example.com";

  assert.equal(getPublicAppUrl(), "https://ufw.example.com");

  process.env.APP_URL = previousAppUrl;
  process.env.BETTER_AUTH_URL = previousBetterAuthUrl;
});

test("getPublicAppUrl falls back to BETTER_AUTH_URL", () => {
  const previousAppUrl = process.env.APP_URL;
  const previousBetterAuthUrl = process.env.BETTER_AUTH_URL;

  delete process.env.APP_URL;
  process.env.BETTER_AUTH_URL = "https://auth.example.com/path";

  assert.equal(getPublicAppUrl(), "https://auth.example.com");

  process.env.APP_URL = previousAppUrl;
  process.env.BETTER_AUTH_URL = previousBetterAuthUrl;
});

test("getPublicAppUrl defaults to localhost", () => {
  const previousAppUrl = process.env.APP_URL;
  const previousBetterAuthUrl = process.env.BETTER_AUTH_URL;

  delete process.env.APP_URL;
  delete process.env.BETTER_AUTH_URL;

  assert.equal(getPublicAppUrl(), "http://localhost:3000");

  process.env.APP_URL = previousAppUrl;
  process.env.BETTER_AUTH_URL = previousBetterAuthUrl;
});
