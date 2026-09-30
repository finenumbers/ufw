import type { SshTargetPolicy } from "@/lib/validations/ssh-host";

function parseAllowedCidrs(raw: string | undefined): string[] {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return [];
  }

  return trimmed
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Runtime SSH target policy. Import only from server code — client forms receive the result as props. */
export function readSshTargetPolicy(
  env: NodeJS.ProcessEnv = process.env,
): SshTargetPolicy {
  return {
    allowDockerHost: env.SSH_ALLOW_DOCKER_HOST?.trim() === "true",
    allowedCidrs: parseAllowedCidrs(env.SSH_ALLOWED_CIDRS),
  };
}
