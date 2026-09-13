import { Fragment, useState } from "react";
import {
  ChevronRight,
  FileCode,
  Folder,
  FolderOpen,
  FolderTree,
  HardDrive,
} from "lucide-react";
import { cn } from "cn";
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

type TreeNode = {
  name: string;
  kind: "drive" | "folder" | "file";
  size?: string;
  children?: TreeNode[];
};

const TREE: TreeNode[] = [
  {
    name: "C:",
    kind: "drive",
    size: "312,4 GB",
    children: [
      {
        name: "Program Files",
        kind: "folder",
        size: "48,2 GB",
        children: [
          { name: "nodejs", kind: "folder", size: "620 MB" },
          { name: "Python311", kind: "folder", size: "1,1 GB" },
          { name: "Git", kind: "folder", size: "340 MB" },
        ],
      },
      {
        name: "Users",
        kind: "folder",
        size: "128,7 GB",
        children: [
          {
            name: "Shifyannn",
            kind: "folder",
            size: "96,4 GB",
            children: [
              { name: "Documents", kind: "folder", size: "12,3 GB" },
              {
                name: "Projects",
                kind: "folder",
                size: "34,8 GB",
                children: [
                  { name: "main.go", kind: "file", size: "2,4 KB" },
                  { name: "App.tsx", kind: "file", size: "18 KB" },
                ],
              },
            ],
          },
        ],
      },
      { name: "Windows", kind: "folder", size: "42,1 GB" },
    ],
  },
  {
    name: "D:",
    kind: "drive",
    size: "402,1 GB",
    children: [
      {
        name: "Coding",
        kind: "folder",
        size: "210,4 GB",
        children: [
          {
            name: "programming-languages-finder",
            kind: "folder",
            size: "1,2 GB",
          },
          { name: "playground", kind: "folder", size: "58,7 GB" },
        ],
      },
      { name: "Games", kind: "folder", size: "180,6 GB" },
    ],
  },
];

type SearchResult = {
  name: string;
  path: string;
  language: string;
  size: string;
  modified: string;
};

const RESULTS: SearchResult[] = [
  {
    name: "main.go",
    path: "D:\\Coding\\programming-languages-finder\\main.go",
    language: "Go",
    size: "1,1 KB",
    modified: "13 Sep 2026 06:12",
  },
  {
    name: "app.go",
    path: "D:\\Coding\\programming-languages-finder\\app.go",
    language: "Go",
    size: "0,6 KB",
    modified: "13 Sep 2026 06:12",
  },
  {
    name: "Header.tsx",
    path: "D:\\Coding\\programming-languages-finder\\frontend\\src\\components\\Header.tsx",
    language: "TypeScript",
    size: "6,2 KB",
    modified: "13 Sep 2026 07:41",
  },
  {
    name: "Body.tsx",
    path: "D:\\Coding\\programming-languages-finder\\frontend\\src\\components\\Body.tsx",
    language: "TypeScript",
    size: "4,8 KB",
    modified: "13 Sep 2026 07:52",
  },
  {
    name: "utils.py",
    path: "D:\\Coding\\playground\\scripts\\utils.py",
    language: "Python",
    size: "3,4 KB",
    modified: "11 Sep 2026 21:08",
  },
  {
    name: "server.py",
    path: "D:\\Coding\\playground\\api\\server.py",
    language: "Python",
    size: "9,7 KB",
    modified: "10 Sep 2026 15:33",
  },
  {
    name: "index.ts",
    path: "D:\\Coding\\playground\\web\\src\\index.ts",
    language: "TypeScript",
    size: "1,9 KB",
    modified: "09 Sep 2026 09:20",
  },
  {
    name: "Cargo.toml",
    path: "D:\\Coding\\playground\\rust\\Cargo.toml",
    language: "Rust",
    size: "0,4 KB",
    modified: "08 Sep 2026 18:47",
  },
  {
    name: "Main.java",
    path: "C:\\Users\\Shifyannn\\Projects\\java\\Main.java",
    language: "Java",
    size: "2,8 KB",
    modified: "07 Sep 2026 11:02",
  },
  {
    name: "config.php",
    path: "C:\\Users\\Shifyannn\\Projects\\web\\config.php",
    language: "PHP",
    size: "1,3 KB",
    modified: "05 Sep 2026 20:14",
  },
];

function TreeItem({
  node,
  path,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  path: string[];
  selectedPath: string[];
  onSelect: (path: string[]) => void;
}) {
  const currentPath = [...path, node.name];
  const hasChildren = Boolean(node.children?.length);
  const [open, setOpen] = useState(node.kind === "drive");
  const selected = currentPath.join("/") === selectedPath.join("/");

  const Icon =
    node.kind === "drive"
      ? HardDrive
      : node.kind === "folder"
        ? open
          ? FolderOpen
          : Folder
        : FileCode;

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => {
          onSelect(currentPath);
          if (hasChildren) setOpen((value) => !value);
        }}
        className={cn(
          "h-7 w-full justify-start gap-1.5 px-1.5 font-normal",
          selected && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: path.length * 14 + 4 }}
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
        {node.size ? (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {node.size}
          </span>
        ) : null}
      </Button>
      {hasChildren && open ? (
        <div className="ml-3.5 border-l border-border pl-0.5">
          {node.children?.map((child) => (
            <TreeItem
              key={child.name}
              node={child}
              path={currentPath}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ResultsPanel({ path }: { path: string[] }) {
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
          {RESULTS.length} file ditemukan
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
            {RESULTS.map((result) => (
              <TableRow key={result.path}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <FileCode className="size-4 shrink-0 text-muted-foreground" />
                    {result.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{result.language}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {result.size}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {result.modified}
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

function StatusBar({ path }: { path: string[] }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-1.5 text-xs text-muted-foreground">
      <span className="shrink-0">{RESULTS.length} item</span>
      <span className="truncate">
        {path.length > 0 ? path.join("\\") : "Belum ada lokasi dipilih"} • Total
        32,2 KB
      </span>
    </div>
  );
}

export function Body() {
  const [selectedPath, setSelectedPath] = useState<string[]>(["C:"]);

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
            {TREE.map((node) => (
              <TreeItem
                key={node.name}
                node={node}
                path={[]}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
              />
            ))}
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel className="flex min-h-0 flex-col">
          <ResultsPanel path={selectedPath} />
        </ResizablePanel>
      </ResizablePanelGroup>
      <Separator />
      <StatusBar path={selectedPath} />
    </div>
  );
}
