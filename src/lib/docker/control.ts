import type { SshClient } from "@/lib/ssh/client";

import { assertValidContainerRef } from "@/lib/docker/container-ref";
import { execDocker } from "@/lib/docker/exec-docker";
import type { DockerContainerAction } from "@/types/docker-monitor";

const ACTION_ARGS: Record<DockerContainerAction, string[]> = {
  START: ["start"],
  STOP: ["stop"],
  RESTART: ["restart"],
};

export async function runDockerContainerControl(
  client: SshClient,
  containerRef: string,
  action: DockerContainerAction,
  options?: { sudoPassword?: string },
): Promise<{ stdout: string; stderr: string; code: number }> {
  const ref = assertValidContainerRef(containerRef);
  return execDocker(client, [...ACTION_ARGS[action], ref], options);
}
