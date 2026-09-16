import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Code,
  FileCode,
  Folder,
  FolderOpen,
  FolderTree,
  HardDrive,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "cn";
import { SearchResult } from "../../hooks/use-file-search";
import { Badge } from "../ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Button } from "../ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuItem,
  ContextMenuContent,
} from "../ui/context-menu";
import { ScrollArea } from "../ui/scroll-area";
import {
  OpenWithDefaultEditor,
  OpenInFolder,
} from "../../../wailsjs/go/main/App";

// Layout kolom dipakai bersama oleh baris header dan baris data; keduanya harus
// memakai konstanta ini agar lebar kolom tidak bergeser.
const GRID =
  "grid grid-cols-[minmax(0,1.6fr)_120px_110px_190px_minmax(0,2fr)] items-center gap-2";

const ROW_HEIGHT = 37;

type FolderNode = {
  name: string;
  path: string;
  count: number;
  children: FolderNode[];
};

function driveLabel(path: string) {
  return path.replace(/[\\/]+$/, "");
}

function buildTree(root: string, results: SearchResult[]): FolderNode {
  const base = root.endsWith("\\") || root.endsWith("/") ? root : `${root}\\`;
  const rootNode: FolderNode = {
    name: driveLabel(root),
    path: base,
    count: results.length,
    children: [],
  };
  const index = new Map<string, FolderNode>([[base, rootNode]]);

  for (const result of results) {
    const dir = result.path.slice(0, result.path.length - result.name.length);
    const relative = dir.slice(base.length).replace(/[\\/]+$/, "");
    if (relative === "") continue;

    let parent = rootNode;
    let path = base;
    for (const segment of relative.split(/[\\/]+/)) {
      path += `${segment}\\`;
      let node = index.get(path);
      if (!node) {
        node = { name: segment, path, count: 0, children: [] };
        index.set(path, node);
        parent.children.push(node);
      }
      node.count += 1;
      parent = node;
    }
  }

  sortByName(rootNode);
  return rootNode;
}

function sortByName(node: FolderNode) {
  node.children.sort((a, b) => a.name.localeCompare(b.name));
  for (const child of node.children) sortByName(child);
}

function crumbsFor(root: FolderNode, active: string): string[] {
  const relative = active.slice(root.path.length).replace(/[\\/]+$/, "");
  return relative === ""
    ? [root.name]
    : [root.name, ...relative.split(/[\\/]+/)];
}

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

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("id-ID");
}

function TreeItem({
  node,
  depth,
  activePath,
  onSelect,
}: {
  node: FolderNode;
  depth: number;
  activePath: string;
  onSelect: (path: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(depth === 0);
  const selected = node.path === activePath;
  const Icon = depth === 0 ? HardDrive : open ? FolderOpen : Folder;

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => {
          onSelect(node.path);
          if (hasChildren) setOpen((value) => !value);
        }}
        className={cn(
          "h-7 w-full justify-start gap-1.5 px-1.5 font-normal text-well-text hover:bg-well-hover hover:text-well-text",
          selected && "bg-well-hover text-well-text",
        )}
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-well-muted transition-transform",
            open && "rotate-90",
            !hasChildren && "opacity-0",
          )}
        />
        <Icon className="size-4 shrink-0 text-well-muted" />
        <span className="min-w-0 flex-1 truncate text-left">{node.name}</span>
        <span className="shrink-0 text-xs tabular-nums text-well-muted">
          {node.count}
        </span>
      </Button>
      {hasChildren && open ? (
        <div className="ml-3.5 border-l border-well-line pl-0.5">
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ResultsPanel({
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

function StatusBar({
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

export function Body({
  results,
  language,
  root,
  runId,
}: {
  results: SearchResult[];
  language: string;
  root: string;
  runId: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(root, results), [root, results]);
  const active = selected ?? tree.path;
  const crumbs = crumbsFor(tree, active);
  const visible = useMemo(
    () => results.filter((result) => result.path.startsWith(active)),
    [results, active],
  );

  // Direset saat run baru, bukan setiap batch, agar pilihan folder tidak hilang
  // di tengah pemindaian yang masih streaming.
  useEffect(() => setSelected(null), [runId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel
          defaultSize="30"
          minSize="18"
          className="flex min-h-0 flex-col"
        >
          <div className="recessed flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl text-well-text">
            <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium">
              <FolderTree className="size-4 text-well-muted" />
              Lokasi
            </div>
            <div className="h-px shrink-0 bg-well-line" />
            <ScrollArea className="min-h-0 flex-1 p-2 [&_[data-slot=scroll-area-thumb]]:bg-well-line">
              {root ? (
                <TreeItem
                  node={tree}
                  depth={0}
                  activePath={active}
                  onSelect={setSelected}
                />
              ) : (
                <p className="px-1.5 py-2 text-xs text-well-muted">
                  Belum ada pemindaian
                </p>
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="mx-2 bg-transparent" />

        <ResizablePanel className="flex min-h-0 flex-col">
          <ResultsPanel
            key={runId}
            path={crumbs}
            results={visible}
            language={language}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      <StatusBar path={crumbs} results={visible} />
    </div>
  );
}
