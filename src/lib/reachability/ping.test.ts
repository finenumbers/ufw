import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPingCommand,
  displayRttMs,
  isPingableAddress,
  parsePingRtt,
} from "@/lib/reachability/ping";

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

test("buildPingCommand uses platform deadlines and rejects unsafe targets", () => {
  assert.deepEqual(buildPingCommand("linux", "1.1.1.1"), {
    command: "ping",
    args: ["-4", "-n", "-c", "1", "-W", "2", "-w", "3", "1.1.1.1"],
  });
  assert.deepEqual(buildPingCommand("linux", "2001:db8::1"), {
    command: "ping",
    args: ["-6", "-n", "-c", "1", "-W", "2", "-w", "3", "2001:db8::1"],
  });
  assert.deepEqual(buildPingCommand("darwin", "1.1.1.1"), {
    command: "ping",
    args: ["-n", "-c", "1", "-W", "2000", "1.1.1.1"],
  });
  assert.deepEqual(buildPingCommand("darwin", "2001:db8::1"), {
    command: "ping6",
    args: ["-n", "-c", "1", "2001:db8::1"],
  });
  assert.equal(buildPingCommand("win32", "1.1.1.1"), null);
  assert.equal(buildPingCommand("linux", "example.com"), null);
  assert.equal(buildPingCommand("linux", "-c"), null);
});

test("isPingableAddress allows only IP literals", () => {
  assert.equal(isPingableAddress("8.8.8.8"), true);
  assert.equal(isPingableAddress("2001:db8::1"), true);
  assert.equal(isPingableAddress("dead.beef"), false);
  assert.equal(isPingableAddress("1.2.3.4;id"), false);
  assert.equal(isPingableAddress("fe80::1%eth0"), false);
});
