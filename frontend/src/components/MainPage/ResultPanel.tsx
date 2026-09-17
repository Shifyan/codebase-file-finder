import { SearchResult } from "@/hooks/use-file-search";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Fragment, useRef } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { cn } from "cn";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuItem,
  ContextMenuContent,
} from "../ui/context-menu";
import { Code, FileCode, Folder } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import {
  OpenInFolder,
  OpenWithDefaultEditor,
} from "../../../wailsjs/go/main/App";
import { Badge } from "../ui/badge";
const ROW_HEIGHT = 37;
const GRID =
  "grid grid-cols-[minmax(0,1.6fr)_120px_110px_190px_minmax(0,2fr)] items-center gap-2";

export function ResultsPanel({
  path,
  results,
  language,
}: {
  path: string[];
  results: SearchResult[];
  language: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    getItemKey: (index) => results[index].path,
  });

  return (
    <div className="recessed flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl text-well-text">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap text-well-muted">
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="hover:text-well-text">
                This PC
              </BreadcrumbLink>
            </BreadcrumbItem>
            {path.map((segment, index) => {
              const isLast = index === path.length - 1;
              return (
                <Fragment key={`${segment}-${index}`}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-well-text">
                        {segment}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href="#" className="hover:text-well-text">
                        {segment}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <span className="shrink-0 text-xs text-well-muted">
          {results.length.toLocaleString("id-ID")} file ditemukan
        </span>
      </div>
      <div className="h-px shrink-0 bg-well-line" />
      <div
        className={cn(
          GRID,
          "shrink-0 border-b border-edge-line/60 px-4 py-2 text-xs font-medium text-well-muted",
        )}
      >
        <span>Nama</span>
        <span>Bahasa</span>
        <span className="text-right">Ukuran</span>
        <span>Diubah</span>
        <span>Path</span>
      </div>
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <div
          className="relative w-full"
          style={{ height: rowVirtualizer.getTotalSize() }}
        >
          {rowVirtualizer.getVirtualItems().map((item) => {
            const result = results[item.index];
            return (
              <ContextMenu>
                <ContextMenuTrigger>
                  <div
                    key={item.key}
                    className={cn(
                      GRID,
                      "absolute hover:cursor-pointer left-0 top-0 w-full border-b border-edge-line/50 px-4 text-sm transition-colors hover:bg-well-hover",
                    )}
                    style={{
                      height: item.size,
                      transform: `translateY(${item.start}px)`,
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <FileCode className="size-4 shrink-0 text-well-muted" />
                      <span className="truncate">{result.name}</span>
                    </span>
                    <span className="min-w-0">
                      <Badge variant="secondary">{language}</Badge>
                    </span>
                    <span className="text-right tabular-nums">
                      {formatBytes(result.size)}
                    </span>
                    <span className="truncate text-well-muted">
                      {formatDate(result.modified)}
                    </span>
                    <span className="truncate text-well-muted">
                      {result.path}
                    </span>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-42">
                  <ContextMenuItem
                    onClick={() => OpenWithDefaultEditor(result.path, false)}
                    className={"hover:cursor-pointer h-9 gap-3"}
                  >
                    <Code />
                    Buka File
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => OpenInFolder(result.path, false)}
                    className={"hover:cursor-pointer h-9 gap-3"}
                  >
                    <Folder />
                    Buka di Folder
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>
    </div>
  );
}
