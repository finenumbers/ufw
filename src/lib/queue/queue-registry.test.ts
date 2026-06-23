import assert from "node:assert/strict";
import test from "node:test";

import { clearServerQueue, runForServer } from "@/lib/queue/queue-registry";

test("runForServer serializes concurrent tasks per server", async () => {
  const serverId = `queue-test-${Date.now()}`;
  const order: number[] = [];

  const first = runForServer(serverId, async () => {
    order.push(1);
    await new Promise((resolve) => setTimeout(resolve, 30));
    order.push(2);
    return "first";
  });

  const second = runForServer(serverId, async () => {
    order.push(3);
    return "second";
  });

  const [a, b] = await Promise.all([first, second]);

  assert.equal(a, "first");
  assert.equal(b, "second");
  assert.deepEqual(order, [1, 2, 3]);

  clearServerQueue(serverId);
});

test("runForServer uses separate queues per server", async () => {
  const left = runForServer("server-a", async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return "a";
  });

  const right = runForServer("server-b", async () => "b");

  const [a, b] = await Promise.all([left, right]);
  assert.equal(a, "a");
  assert.equal(b, "b");

  clearServerQueue("server-a");
  clearServerQueue("server-b");
});
