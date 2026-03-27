"use client";

import { Loader2, FilePlus, FilePen, Eye, Trash2, Wrench } from "lucide-react";

type ToolInvocationState = "partial-call" | "call" | "result";

interface ToolInvocationBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: ToolInvocationState;
}

const STR_REPLACE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  create:      { label: "Creating",  icon: <FilePlus className="w-3 h-3" /> },
  str_replace: { label: "Editing",   icon: <FilePen  className="w-3 h-3" /> },
  insert:      { label: "Editing",   icon: <FilePen  className="w-3 h-3" /> },
  view:        { label: "Reading",   icon: <Eye      className="w-3 h-3" /> },
  undo_edit:   { label: "Reverting", icon: <FilePen  className="w-3 h-3" /> },
};

function getLabel(toolName: string, args: Record<string, unknown>): { label: string; icon: React.ReactNode; file?: string } {
  if (toolName === "str_replace_editor") {
    const command = args.command as string | undefined;
    const path = args.path as string | undefined;
    const meta = (command && STR_REPLACE_LABELS[command]) ?? { label: "Processing", icon: <Wrench className="w-3 h-3" /> };
    const file = path ? path.split("/").pop() : undefined;
    return { ...meta, file };
  }

  if (toolName === "file_manager") {
    const command = args.command as string | undefined;
    const path = (args.path ?? args.source) as string | undefined;
    const file = path ? path.split("/").pop() : undefined;
    if (command === "delete") return { label: "Deleting", icon: <Trash2 className="w-3 h-3" />, file };
    if (command === "rename") return { label: "Renaming", icon: <FilePen className="w-3 h-3" />, file };
    return { label: "Managing file", icon: <Wrench className="w-3 h-3" />, file };
  }

  return { label: toolName, icon: <Wrench className="w-3 h-3" /> };
}

export function ToolInvocationBadge({ toolName, args, state }: ToolInvocationBadgeProps) {
  const { label, icon, file } = getLabel(toolName, args);
  const done = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      {icon}
      <span className="text-neutral-700">
        {label}{file && <> <span className="font-mono">{file}</span></>}
      </span>
    </div>
  );
}
