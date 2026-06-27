import assert from "node:assert/strict";
import test from "node:test";

import { getAppVersionLabel, getBuildRevision } from "@/lib/app-version";

test("getAppVersionLabel includes revision when BUILD_SHA is set", () => {
  const previousVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  const previousSha = process.env.NEXT_PUBLIC_BUILD_SHA;

  process.env.NEXT_PUBLIC_APP_VERSION = "0.4.2";
  process.env.NEXT_PUBLIC_BUILD_SHA = "3d70485abcdef";

  assert.equal(getBuildRevision(), "3d70485");
  assert.equal(getAppVersionLabel(), "v0.4.2 · 3d70485");

  if (previousVersion === undefined) {
    delete process.env.NEXT_PUBLIC_APP_VERSION;
  } else {
    process.env.NEXT_PUBLIC_APP_VERSION = previousVersion;
  }

  if (previousSha === undefined) {
    delete process.env.NEXT_PUBLIC_BUILD_SHA;
  } else {
    process.env.NEXT_PUBLIC_BUILD_SHA = previousSha;
  }
});

test("getAppVersionLabel omits revision when BUILD_SHA is unknown", () => {
  const previousSha = process.env.NEXT_PUBLIC_BUILD_SHA;
  process.env.NEXT_PUBLIC_BUILD_SHA = "unknown";

  assert.match(getAppVersionLabel(), /^v\d+\.\d+\.\d+$/);

  if (previousSha === undefined) {
    delete process.env.NEXT_PUBLIC_BUILD_SHA;
  } else {
    process.env.NEXT_PUBLIC_BUILD_SHA = previousSha;
  }
});
