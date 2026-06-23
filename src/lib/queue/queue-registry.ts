import PQueue from "p-queue";

import { createChildLogger } from "@/lib/logger";

const log = createChildLogger("queue-registry");

const queues = new Map<string, PQueue>();

function getQueue(serverId: string): PQueue {
  let queue = queues.get(serverId);
  if (!queue) {
    queue = new PQueue({ concurrency: 1 });
    queues.set(serverId, queue);
    log.debug({ serverId }, "Created queue for server");
  }
  return queue;
}

export type RunForServerOptions = {
  onStart?: () => void | Promise<void>;
};

export async function runForServer<T>(
  serverId: string,
  task: () => Promise<T>,
  options?: RunForServerOptions,
): Promise<T> {
  const queue = getQueue(serverId);
  return queue.add(async () => {
    await options?.onStart?.();
    return task();
  }) as Promise<T>;
}

export async function waitForServerQueueIdle(serverId: string): Promise<void> {
  const queue = queues.get(serverId);
  if (!queue) {
    return;
  }
  await queue.onIdle();
}

export function clearServerQueue(serverId: string): void {
  queues.delete(serverId);
}

export function isServerQueueBusy(serverId: string): boolean {
  const queue = queues.get(serverId);
  if (!queue) {
    return false;
  }
  return queue.pending > 0 || queue.size > 0;
}
