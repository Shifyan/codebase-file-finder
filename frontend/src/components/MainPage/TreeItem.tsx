import { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "cn";
import { ChevronRight, Folder, FolderOpen, HardDrive } from "lucide-react";

type FolderNode = {
  name: string;
  path: string;
  count: number;
  children: FolderNode[];
};

export function TreeItem({
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
