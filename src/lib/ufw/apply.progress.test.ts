import assert from "node:assert/strict";
import test from "node:test";

import { executeApplyPlan, type ApplyProgressEvent } from "@/lib/ufw/apply";
import { UFW_COMMANDS } from "@/lib/ufw/commands";
import type { SshClient } from "@/lib/ssh/client";

const client = {
  exec: async () => ({ code: 0, stdout: "", stderr: "" }),
} as unknown as SshClient;

test("executeApplyPlan reports progress for each command", async () => {
  const events: ApplyProgressEvent[] = [];
  let callCount = 0;

  const result = await executeApplyPlan(
    client,
    {
      items: [
        {
          action: "ADD",
          fingerprint: "fp1",
          remoteCommand: "ufw allow 22/tcp",
          sortOrder: 0,
        },
        {
          action: "REMOVE",
          fingerprint: "fp2",
          remoteCommand: "ufw delete 1",
          sortOrder: 1,
        },
      ],
      summary: { addCount: 1, removeCount: 1, updateCount: 0 },
    },
    undefined,
    {
      onProgress: async (event) => {
        events.push(event);
      },
      exec: async (_client, command) => {
        callCount += 1;
        if (command === UFW_COMMANDS.statusNumbered) {
          return { code: 0, stdout: "Status: active", stderr: "" };
        }
        return { code: 0, stdout: "ok", stderr: "" };
      },
    },
  );

  assert.equal(result.success, true);
  assert.equal(callCount, 3);
  assert.equal(events.length, 4);
  assert.equal(events[0]?.status, "RUNNING");
  assert.equal(events[1]?.status, "SUCCESS");
  assert.equal(events[2]?.status, "RUNNING");
  assert.equal(events[3]?.status, "SUCCESS");
});

test("executeApplyPlan stops after first failed command", async () => {
  let execCalls = 0;

  const result = await executeApplyPlan(
    client,
    {
      items: [
        {
          action: "ADD",
          fingerprint: "fp1",
          remoteCommand: "ufw allow 22/tcp",
          sortOrder: 0,
        },
        {
          action: "ADD",
          fingerprint: "fp2",
          remoteCommand: "ufw allow 443/tcp",
          sortOrder: 1,
        },
      ],
      summary: { addCount: 2, removeCount: 0, updateCount: 0 },
    },
    undefined,
    {
      exec: async () => {
        execCalls += 1;
        if (execCalls === 1) {
          return { code: 1, stdout: "", stderr: "permission denied" };
        }
        return { code: 0, stdout: "ok", stderr: "" };
      },
    },
  );

  assert.equal(result.success, false);
  assert.equal(result.partial, false);
  assert.equal(execCalls, 1);
});

test("executeApplyPlan reports failed step progress", async () => {
  const events: ApplyProgressEvent[] = [];

  const result = await executeApplyPlan(
    client,
    {
      items: [
        {
          action: "ADD",
          fingerprint: "fp1",
          remoteCommand: "ufw allow 22/tcp",
          sortOrder: 0,
        },
      ],
      summary: { addCount: 1, removeCount: 0, updateCount: 0 },
    },
    undefined,
    {
      onProgress: async (event) => {
        events.push(event);
      },
      exec: async (_client, command) => {
        if (command === UFW_COMMANDS.statusNumbered) {
          return { code: 0, stdout: "Status: active", stderr: "" };
        }
        return { code: 1, stdout: "", stderr: "permission denied" };
      },
    },
  );

  assert.equal(result.success, false);
  assert.equal(events.at(-1)?.status, "FAILED");
  assert.match(events.at(-1)?.error ?? "", /permission denied/);
});

test("executeApplyPlan fails when post-apply status read fails", async () => {
  const result = await executeApplyPlan(
    client,
    {
      items: [
        {
          action: "ADD",
          fingerprint: "fp1",
          remoteCommand: "ufw allow 22/tcp",
          sortOrder: 0,
        },
      ],
      summary: { addCount: 1, removeCount: 0, updateCount: 0 },
    },
    undefined,
    {
      exec: async (_client, command) => {
        if (command === UFW_COMMANDS.statusNumbered) {
          return { code: 1, stdout: "", stderr: "status read failed" };
        }
        return { code: 0, stdout: "ok", stderr: "" };
      },
    },
  );

  assert.equal(result.success, false);
  assert.equal(result.partial, true);
  assert.match(result.errors[0] ?? "", /status read failed/);
});

test("executeApplyPlan marks partial when status read fails after partial execution", async () => {
  const result = await executeApplyPlan(
    client,
    {
      items: [
        {
          action: "ADD",
          fingerprint: "fp1",
          remoteCommand: "ufw allow 22/tcp",
          sortOrder: 0,
        },
        {
          action: "ADD",
          fingerprint: "fp2",
          remoteCommand: "ufw allow 443/tcp",
          sortOrder: 1,
        },
      ],
      summary: { addCount: 2, removeCount: 0, updateCount: 0 },
    },
    undefined,
    {
      exec: async (_client, command) => {
        if (command === "ufw allow 443/tcp") {
          return { code: 1, stdout: "", stderr: "denied" };
        }
        if (command === UFW_COMMANDS.statusNumbered) {
          return { code: 0, stdout: "Status: active", stderr: "" };
        }
        return { code: 0, stdout: "ok", stderr: "" };
      },
    },
  );

  assert.equal(result.success, false);
  assert.equal(result.partial, true);
});
