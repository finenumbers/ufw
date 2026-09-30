import dns from "node:dns/promises";

import { readSshTargetPolicy } from "@/lib/ssh/target-policy";
import {
  DOCKER_HOST_UNRESOLVED_MESSAGE,
  DOCKER_HOST_UNROUTABLE_MESSAGE,
  isAcceptableDockerHostGateway,
  isDockerHostAlias,
  validateResolvedIp,
  validateSshHost,
  type SshTargetPolicy,
} from "@/lib/validations/ssh-host";

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;

export type HostLookup = (host: string) => Promise<string>;

function isLiteralIp(host: string): boolean {
  return IPV4_PATTERN.test(host) || host.includes(":");
}

async function defaultLookup(host: string): Promise<string> {
  const result = await dns.lookup(host, { family: 4 });
  return result.address;
}

/**
 * Resolve a managed SSH or scan target.
 * The docker-host alias is accepted only when policy allows it and DNS returns an RFC1918 address.
 * Literal private IPs stay blocked unless they match allowedCidrs.
 */
export async function resolveManagedHost(
  host: string,
  policy: SshTargetPolicy,
  lookup: HostLookup = defaultLookup,
): Promise<string> {
  const trimmed = host.trim();
  const validationError = validateSshHost(trimmed, policy);
  if (validationError) {
    throw new Error(validationError);
  }

  if (isLiteralIp(trimmed)) {
    const resolvedError = validateResolvedIp(trimmed, policy);
    if (resolvedError) {
      throw new Error(resolvedError);
    }

    return trimmed;
  }

  if (isDockerHostAlias(trimmed)) {
    let address: string;
    try {
      address = await lookup(trimmed);
    } catch {
      throw new Error(DOCKER_HOST_UNRESOLVED_MESSAGE);
    }

    if (!isAcceptableDockerHostGateway(address)) {
      throw new Error(DOCKER_HOST_UNROUTABLE_MESSAGE);
    }

    return address;
  }

  const address = await lookup(trimmed);
  const resolvedError = validateResolvedIp(address, policy);
  if (resolvedError) {
    throw new Error(resolvedError);
  }

  return address;
}

/** Resolve hostnames to IPv4 and pin the address for SSH connect (blocks DNS rebinding). */
export async function resolveSshConnectHost(host: string): Promise<string> {
  return resolveManagedHost(host, readSshTargetPolicy());
}
