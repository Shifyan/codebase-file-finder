import { useEffect, useMemo, useState } from "react";
import { FolderTree } from "lucide-react";
import { SearchResult } from "../../hooks/use-file-search";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";

import { ScrollArea } from "../ui/scroll-area";

import { TreeItem } from "./TreeItem";
import { ResultsPanel } from "./ResultPanel";
import { StatusBar } from "./StatusBar";

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
