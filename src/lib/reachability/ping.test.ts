import assert from "node:assert/strict";
import test from "node:test";

import { buildPingCommand, classifyPingResult, displayRttMs, parsePingRtt } from "@/lib/reachability/ping";

test("parsePingRtt reads linux, macos, and localized samples", () => {
  assert.equal(
    parsePingRtt("64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=83.2 ms"),
    83.2,
  );
  assert.equal(parsePingRtt("64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=12.345 ms"), 12.345);
  assert.equal(parsePingRtt("64 байта от 1.1.1.1: icmp_seq=1 ttl=57 время=83,2 мс"), 83.2);
  assert.equal(parsePingRtt("time<1 ms"), 1);
  assert.equal(parsePingRtt("Request timeout"), null);
});

test("displayRttMs rounds and never shows zero for a reply", () => {
  assert.equal(displayRttMs(83.2), 83);
  assert.equal(displayRttMs(0.4), 1);
});

test("buildPingCommand is numeric ping -n -c 1 of the saved host", () => {
  assert.deepEqual(buildPingCommand("poland.gate.finenumbers.com"), {
    command: "ping",
    args: ["-n", "-c", "1", "poland.gate.finenumbers.com"],
  });
  assert.deepEqual(buildPingCommand("1.1.1.1"), {
    command: "ping",
    args: ["-n", "-c", "1", "1.1.1.1"],
  });
  assert.deepEqual(buildPingCommand("  8.8.8.8  "), {
    command: "ping",
    args: ["-n", "-c", "1", "8.8.8.8"],
  });
  assert.equal(buildPingCommand("-c"), null);
  assert.equal(buildPingCommand("bad host"), null);
  assert.equal(buildPingCommand(""), null);
});

test("classifyPingResult treats a reply as success even when stderr warns about the socket", () => {
  const outcome = classifyPingResult({
    code: 0,
    stdout: "64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=83.2 ms\n",
    stderr: "ping: socktype: SOCK_DGRAM\nping: socket: Operation not permitted\n",
  });
  assert.deepEqual(outcome, { kind: "reply", rttMs: 83 });
});

test("classifyPingResult keeps a time sample when ping is killed after the reply", () => {
  assert.deepEqual(
    classifyPingResult({
      code: null,
      stdout: "64 bytes from poland.gate.finenumbers.com: icmp_seq=1 ttl=57 time=12.4 ms\n",
    }),
    { kind: "reply", rttMs: 12 },
  );
});

test("classifyPingResult keeps exit 0 without a time sample as a reply", () => {
  assert.deepEqual(classifyPingResult({ code: 0, stdout: "1 packets transmitted, 1 received\n" }), {
    kind: "reply",
    rttMs: null,
  });
});

test("classifyPingResult marks silence as a timeout for that host", () => {
  assert.deepEqual(
    classifyPingResult({
      code: 1,
      stdout: "1 packets transmitted, 0 received, 100% packet loss\n",
    }),
    { kind: "timeout" },
  );
});

test("classifyPingResult marks a missing socket as probe failure, not host silence", () => {
  const outcome = classifyPingResult({
    code: 2,
    stdout: "",
    stderr: "ping: socket: Operation not permitted\n",
  });
  assert.equal(outcome.kind, "unavailable");
});

test("classifyPingResult keeps a DNS miss on that host", () => {
  assert.deepEqual(
    classifyPingResult({
      code: 2,
      stdout: "",
      stderr: "ping: poland.example: Name or service not known\n",
    }),
    { kind: "timeout" },
  );
});
