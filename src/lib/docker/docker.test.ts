import assert from "node:assert/strict";
import test from "node:test";

import { isValidContainerRef, assertValidContainerRef } from "@/lib/docker/container-ref";
import { parseDockerPsOutput, parsePublishedPorts } from "@/lib/docker/ps-parser";
import { parseDockerStatsOutput } from "@/lib/docker/stats-parser";
import { mergePsAndStats, summarizeInventory } from "@/lib/docker/normalize";
import { maskEnvValue } from "@/lib/docker/mask-env";

test("parsePublishedPorts extracts host mappings", () => {
  const ports = parsePublishedPorts("0.0.0.0:8080->8088/tcp, :::443->443/tcp");
  assert.equal(ports.length, 2);
  assert.equal(ports[0]?.container, 8088);
  assert.equal(ports[1]?.protocol, "tcp");
});

test("parseDockerPsOutput parses json lines", () => {
  const output = [
    '{"ID":"abc123def456","Names":"/web","Image":"nginx:latest","Status":"Up 2 hours","State":"running","Ports":"0.0.0.0:80->80/tcp","Labels":"com.docker.compose.project=demo,com.docker.compose.service=web"}',
  ].join("\n");

  const rows = parseDockerPsOutput(output);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.containerId, "abc123def456");
  assert.equal(rows[0]?.composeProject, "demo");
});

test("parseDockerStatsOutput parses cpu and memory", () => {
  const output =
    '{"Container":"abc123def456","Name":"/web","CPUPerc":"1.25%","MemUsage":"24MiB / 2GiB"}';
  const rows = parseDockerStatsOutput(output);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.cpuPercent, 1.25);
  assert.ok(rows[0]?.memUsageBytes && rows[0].memUsageBytes > BigInt(0));
});

test("mergePsAndStats joins by container id", () => {
  const ps = parseDockerPsOutput(
    '{"ID":"abc123def456","Names":"/web","Image":"nginx","Status":"Up","State":"running","Ports":""}',
  );
  const stats = parseDockerStatsOutput(
    '{"ID":"abc123def456","Name":"/web","CPUPerc":"2.00%","MemUsage":"10MiB / 1GiB"}',
  );
  const merged = mergePsAndStats(ps, stats);
  assert.equal(merged[0]?.cpuPercent, 2);
  assert.equal(summarizeInventory(merged).runningCount, 1);
});

test("container ref validation rejects shell injection", () => {
  assert.equal(isValidContainerRef("abc123def456"), true);
  assert.equal(isValidContainerRef("ufw-app"), true);
  assert.throws(() => assertValidContainerRef("abc; rm -rf /"));
});

test("maskEnvValue masks secret keys", () => {
  const masked = maskEnvValue("DB_PASSWORD", "supersecret");
  assert.equal(masked.masked, true);
  assert.notEqual(masked.value, "supersecret");
});
