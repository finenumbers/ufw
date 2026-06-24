const COLUMN_CLASSES: Record<string, string> = {
  ufwNumber: "w-[30px] max-w-[30px]",
  group: "w-[110px] max-w-[110px]",
  name: "w-[110px] max-w-[110px]",
  action: "w-[90px] max-w-[90px]",
  direction: "w-[85px] max-w-[85px]",
  interface: "w-[90px] max-w-[90px]",
  protocol: "w-[80px] max-w-[80px]",
  logMode: "w-[90px] max-w-[90px]",
  ipv6: "w-[70px] max-w-[70px]",
  fromPort: "w-[75px] max-w-[75px]",
  toPort: "w-[75px] max-w-[75px]",
};

export function getRulesTableColumnClass(columnId: string): string | undefined {
  return COLUMN_CLASSES[columnId];
}
