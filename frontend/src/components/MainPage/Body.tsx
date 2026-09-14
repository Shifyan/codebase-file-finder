import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  FileCode,
  Folder,
  FolderOpen,
  FolderTree,
  HardDrive,
} from "lucide-react";
import { cn } from "cn";
import { scanner } from "../../../wailsjs/go/models";
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
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type FolderNode = {
  name: string;
  path: string;
  count: number;
  children: FolderNode[];
};

function driveLabel(path: string) {
  return path.replace(/[\\/]+$/, "");
}

function buildTree(root: string, results: scanner.Result[]): FolderNode {
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
          "h-7 w-full justify-start gap-1.5 px-1.5 font-normal",
          selected && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
            !hasChildren && "opacity-0",
          )}
        />
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-left">{node.name}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {node.count}
        </span>
      </Button>
      {hasChildren && open ? (
        <div className="ml-3.5 border-l border-border pl-0.5">
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
  results: scanner.Result[];
  language: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4 px-3 py-2">
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink href="#">This PC</BreadcrumbLink>
            </BreadcrumbItem>
            {path.map((segment, index) => {
              const isLast = index === path.length - 1;
              return (
                <Fragment key={`${segment}-${index}`}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{segment}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href="#">{segment}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <span className="shrink-0 text-xs text-muted-foreground">
          {results.length} file ditemukan
        </span>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background">
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Bahasa</TableHead>
              <TableHead className="text-right">Ukuran</TableHead>
              <TableHead>Diubah</TableHead>
              <TableHead>Path</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.path}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <FileCode className="size-4 shrink-0 text-muted-foreground" />
                    {result.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{language}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBytes(result.size)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(result.modified)}
                </TableCell>
                <TableCell className="max-w-[260px] truncate text-muted-foreground">
                  {result.path}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </>
  );
}

function StatusBar({
  path,
  results,
}: {
  path: string[];
  results: scanner.Result[];
}) {
  const total = results.reduce((sum, result) => sum + result.size, 0);
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-1.5 text-xs text-muted-foreground">
      <span className="shrink-0">{results.length} item</span>
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
}: {
  results: scanner.Result[];
  language: string;
  root: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(root, results), [root, results]);
  const active = selected ?? tree.path;
  const crumbs = crumbsFor(tree, active);
  const visible = useMemo(
    () => results.filter((result) => result.path.startsWith(active)),
    [results, active],
  );

  useEffect(() => setSelected(null), [results]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 flex-1"
      >
        <ResizablePanel
          defaultSize="30"
          minSize="18"
          className="flex min-h-0 flex-col"
        >
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
            <FolderTree className="size-4 text-muted-foreground" />
            Lokasi
          </div>
          <Separator />
          <ScrollArea className="min-h-0 flex-1 p-2">
            {root ? (
              <TreeItem
                node={tree}
                depth={0}
                activePath={active}
                onSelect={setSelected}
              />
            ) : (
              <p className="px-1.5 py-2 text-xs text-muted-foreground">
                Belum ada pemindaian
              </p>
            )}
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel className="flex min-h-0 flex-col">
          <ResultsPanel
            path={crumbs}
            results={visible}
            language={language}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      <Separator />
      <StatusBar path={crumbs} results={visible} />
    </div>
  );
}
