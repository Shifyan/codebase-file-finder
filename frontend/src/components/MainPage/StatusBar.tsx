import { SearchResult } from "@/hooks/use-file-search";

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function StatusBar({
  path,
  results,
}: {
  path: string[];
  results: SearchResult[];
}) {
  const total = results.reduce((sum, result) => sum + result.size, 0);
  return (
    <div className="raised flex items-center justify-between gap-4 rounded-xl px-4 py-2 text-xs text-muted-foreground">
      <span className="shrink-0">
        {results.length.toLocaleString("id-ID")} item
      </span>
      <span className="truncate">
        {path.length > 0 ? path.join("\\") : "Belum ada lokasi dipilih"} • Total{" "}
        {formatBytes(total)}
      </span>
    </div>
  );
}
