import type { NmapEnrichmentRow } from "@/types/port-scan";

function readTag(block: string, tag: string): string | null {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(pattern);
  if (!match?.[1]) return null;
  return match[1].trim() || null;
}

function readAttr(block: string, attr: string): string | null {
  const pattern = new RegExp(`${attr}="([^"]*)"`, "i");
  const match = block.match(pattern);
  return match?.[1]?.trim() || null;
}

export function parseNmapXmlOutput(xml: string): NmapEnrichmentRow[] {
  const rows: NmapEnrichmentRow[] = [];
  const portBlocks = xml.match(/<port[\s\S]*?<\/port>/gi) ?? [];

  for (const block of portBlocks) {
    const portId = readAttr(block, "portid");
    const port = portId ? Number.parseInt(portId, 10) : NaN;
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      continue;
    }

    const protocol = (readAttr(block, "protocol") ?? "tcp").toLowerCase();
    const state = readAttr(block.match(/<state[\s\S]*?\/>|<state[\s\S]*?<\/state>/i)?.[0] ?? "", "state") ?? "open";

    const serviceBlock = block.match(/<service[\s\S]*?\/>|<service[\s\S]*?<\/service>/i)?.[0] ?? "";
    const serviceName = readAttr(serviceBlock, "name");
    const product = readAttr(serviceBlock, "product");
    const version = readAttr(serviceBlock, "version");
    const extrainfo = readAttr(serviceBlock, "extrainfo");
    const cpe = readTag(block, "cpe");

    rows.push({
      port,
      protocol,
      state,
      serviceName,
      product,
      version,
      banner: extrainfo,
      cpe,
      raw: block,
    });
  }

  return rows.sort((left, right) => left.port - right.port);
}
