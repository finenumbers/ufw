type Waiter = {
  kind: "shared" | "exclusive";
  resume: () => void;
};

/**
 * Shared lock for node connections, exclusive lock for tunnel apply/down.
 * A waiting apply does not start behind an endless stream of new connections.
 */
export class AwgGate {
  private readers = 0;
  private writer = false;
  private queue: Waiter[] = [];

  shared<T>(fn: () => Promise<T>): Promise<T> {
    return this.enter("shared", fn);
  }

  exclusive<T>(fn: () => Promise<T>): Promise<T> {
    return this.enter("exclusive", fn);
  }

  private async enter<T>(kind: Waiter["kind"], fn: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      this.queue.push({ kind, resume: resolve });
      this.pump();
    });
    try {
      return await fn();
    } finally {
      if (kind === "shared") {
        this.readers -= 1;
      } else {
        this.writer = false;
      }
      this.pump();
    }
  }

  private pump(): void {
    while (!this.writer && this.queue[0]?.kind === "shared") {
      const next = this.queue.shift();
      if (!next) {
        return;
      }
      this.readers += 1;
      next.resume();
    }

    if (!this.writer && this.readers === 0 && this.queue[0]?.kind === "exclusive") {
      const next = this.queue.shift();
      if (!next) {
        return;
      }
      this.writer = true;
      next.resume();
    }
  }
}

export const awgGate = new AwgGate();
