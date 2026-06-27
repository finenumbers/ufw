type InventoryPanelStatusProps = {
  date: string;
  itemsLabel: string;
};

export function InventoryPanelStatus({ date, itemsLabel }: InventoryPanelStatusProps) {
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {date} · {itemsLabel}
    </p>
  );
}
