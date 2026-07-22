import { ANYWHERE, normalizeAddress } from "@/lib/ufw/types";
import type { UnifiedRuleRow } from "@/types/rule";

type AddressRange = {
  start: bigint;
  end: bigint;
};

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }

  let value = 0;
  for (const part of parts) {
    const octet = Number.parseInt(part, 10);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null;
    }
    value = (value << 8) + octet;
  }

  return value >>> 0;
}

function parseIpv4Range(address: string): AddressRange | null {
  const trimmed = address.trim();
  const [networkRaw, prefixRaw] = trimmed.split("/");
  const prefix = prefixRaw ? Number(prefixRaw) : 32;

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return null;
  }

  const networkInt = ipv4ToInt(networkRaw);
  if (networkInt == null) {
    return null;
  }

  if (prefix === 32) {
    const value = BigInt(networkInt);
    return { start: value, end: value };
  }

  const hostBits = 32 - prefix;
  const size = 1n << BigInt(hostBits);
  const mask = hostBits === 32 ? 0xffffffffn : ((1n << BigInt(prefix)) - 1n) << BigInt(hostBits);
  const start = BigInt(networkInt) & mask;
  return { start, end: start + size - 1n };
}

function normalizeComparableAddress(value?: string | null): string | null {
  const normalized = normalizeAddress(value);
  if (!normalized || normalized === ANYWHERE) {
    return null;
  }
  return normalized;
}

function extractComparableAddresses(row: UnifiedRuleRow): string[] {
  const addresses = [
    normalizeComparableAddress(row.core.fromAddress),
    normalizeComparableAddress(row.core.toAddress),
  ];

  return [...new Set(addresses.filter((value): value is string => value !== null))];
}

function parseAddressRanges(address: string, ipv6: boolean): AddressRange[] {
  if (ipv6) {
    return [];
  }

  const range = parseIpv4Range(address);
  return range ? [range] : [];
}

function rangesOverlap(left: AddressRange, right: AddressRange): boolean {
  return left.start <= right.end && right.start <= left.end;
}

function addressesOverlap(left: string, right: string, ipv6: boolean): boolean {
  if (ipv6) {
    return left === right;
  }

  const leftRanges = parseAddressRanges(left, ipv6);
  const rightRanges = parseAddressRanges(right, ipv6);

  if (leftRanges.length === 0 || rightRanges.length === 0) {
    return false;
  }

  return leftRanges.some((leftRange) =>
    rightRanges.some((rightRange) => rangesOverlap(leftRange, rightRange)),
  );
}

function rowsOverlap(left: UnifiedRuleRow, right: UnifiedRuleRow): boolean {
  if (left.isDeleted || right.isDeleted) {
    return false;
  }

  if (left.clientRowId === right.clientRowId) {
    return false;
  }

  const leftDirection = left.core.direction ?? "IN";
  const rightDirection = right.core.direction ?? "IN";
  if (leftDirection !== rightDirection) {
    return false;
  }

  if (left.core.ipv6 !== right.core.ipv6) {
    return false;
  }

  const leftAddresses = extractComparableAddresses(left);
  const rightAddresses = extractComparableAddresses(right);

  if (leftAddresses.length === 0 || rightAddresses.length === 0) {
    return false;
  }

  return leftAddresses.some((leftAddress) =>
    rightAddresses.some((rightAddress) =>
      addressesOverlap(leftAddress, rightAddress, left.core.ipv6),
    ),
  );
}

export function findOverlappingRowIds(rows: UnifiedRuleRow[]): Set<string> {
  const activeRows = rows.filter((row) => !row.isDeleted);
  const overlapping = new Set<string>();

  for (let index = 0; index < activeRows.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < activeRows.length; otherIndex += 1) {
      const left = activeRows[index];
      const right = activeRows[otherIndex];
      if (!left || !right || !rowsOverlap(left, right)) {
        continue;
      }

      overlapping.add(left.clientRowId);
      overlapping.add(right.clientRowId);
    }
  }

  return overlapping;
}

export function countOverlappingRows(rows: UnifiedRuleRow[]): number {
  return findOverlappingRowIds(rows).size;
}
