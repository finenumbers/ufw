import assert from "node:assert/strict";
import test from "node:test";

import { buildCoverageMap, computeUfwCoverage } from "@/lib/port-scan/coverage";
import { parseNaabuJsonOutput } from "@/lib/port-scan/naabu-parser";
import { mergeDiscoveryAndEnrichment, summarizeFindings } from "@/lib/port-scan/normalize";
import { parseNmapXmlOutput } from "@/lib/port-scan/nmap-parser";

test("parseNaabuJsonOutput extracts unique open ports", () => {
  const output = [
    '{"host":"10.0.0.1","ip":"10.0.0.1","port":22,"protocol":"tcp"}',
    '{"host":"10.0.0.1","ip":"10.0.0.1","port":22,"protocol":"tcp"}',
    '{"host":"10.0.0.1","ip":"10.0.0.1","port":443,"protocol":"tcp"}',
  ].join("\n");

  const rows = parseNaabuJsonOutput(output);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.port), [22, 443]);
});

test("parseNmapXmlOutput extracts service metadata", () => {
  const xml = `<?xml version="1.0"?>
<nmaprun>
  <host>
    <ports>
      <port protocol="tcp" portid="443">
        <state state="open" />
        <service name="https" product="nginx" version="1.24.0" extrainfo="Ubuntu" />
        <cpe>cpe:/a:nginx:nginx:1.24.0</cpe>
      </port>
    </ports>
  </host>
</nmaprun>`;

  const rows = parseNmapXmlOutput(xml);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.serviceName, "https");
  assert.equal(rows[0]?.product, "nginx");
  assert.equal(rows[0]?.version, "1.24.0");
});

test("computeUfwCoverage requires inbound allow from any for external scan", () => {
  const rules = [
    {
      action: "ALLOW" as const,
      direction: "IN" as const,
      protocol: "TCP" as const,
      fromAddress: "any",
      toPort: "22",
      fromPort: null,
    },
  ];

  assert.equal(computeUfwCoverage(22, "tcp", rules, { ufwActive: true }), "ALLOWED");
  assert.equal(computeUfwCoverage(8080, "tcp", rules, { ufwActive: true }), "NOT_IN_UFW");
});

test("computeUfwCoverage ignores whitelist-only allow rules for external scan", () => {
  const rules = [
    {
      action: "ALLOW" as const,
      direction: "IN" as const,
      protocol: "TCP" as const,
      fromAddress: "5.227.161.160/27",
      toPort: null,
      fromPort: null,
    },
    {
      action: "ALLOW" as const,
      direction: "IN" as const,
      protocol: "TCP" as const,
      fromAddress: "any",
      toPort: "80",
      fromPort: null,
    },
  ];

  assert.equal(computeUfwCoverage(80, "tcp", rules, { ufwActive: true }), "ALLOWED");
  assert.equal(computeUfwCoverage(22, "tcp", rules, { ufwActive: true }), "NOT_IN_UFW");
  assert.equal(computeUfwCoverage(3306, "tcp", rules, { ufwActive: true }), "NOT_IN_UFW");
});

test("computeUfwCoverage ignores outbound rules", () => {
  const rules = [
    {
      action: "ALLOW" as const,
      direction: "OUT" as const,
      protocol: "TCP" as const,
      fromAddress: "any",
      toPort: "443",
      fromPort: null,
    },
  ];

  assert.equal(computeUfwCoverage(443, "tcp", rules, { ufwActive: true }), "NOT_IN_UFW");
});

test("mergeDiscoveryAndEnrichment combines naabu and nmap rows", () => {
  const discovery = parseNaabuJsonOutput('{"host":"1.1.1.1","port":443,"protocol":"tcp"}');
  const enrichment = parseNmapXmlOutput(`<nmaprun><host><ports><port protocol="tcp" portid="443"><state state="open"/><service name="https" product="nginx"/></port></ports></host></nmaprun>`);
  const coverage = buildCoverageMap([{ port: 443, protocol: "tcp" }], [
    {
      action: "ALLOW",
      direction: "IN",
      protocol: "TCP",
      fromAddress: "any",
      toPort: "443",
      fromPort: null,
    },
  ], { ufwActive: true });

  const merged = mergeDiscoveryAndEnrichment(discovery, enrichment, coverage);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.serviceName, "https");
  assert.equal(merged[0]?.ufwCoverage, "ALLOWED");
  assert.equal(summarizeFindings(merged).openCount, 1);
});
