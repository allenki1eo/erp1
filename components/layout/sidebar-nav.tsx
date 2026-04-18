"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, isGroup, type NavGroup, type NavLeaf } from "./nav-config";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function Leaf({ item, onNavigate }: { item: NavLeaf; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function Group({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const pathname = usePathname();
  const hasActive = group.items.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );
  const [open, setOpen] = useState(hasActive || group.defaultOpen);
  const Icon = group.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            hasActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className="flex-1 truncate text-left">{group.label}</span>
          <ChevronRight
            className={cn("size-4 shrink-0 transition-transform", open && "rotate-90")}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-none">
        <div className="ml-6 mt-1 flex flex-col gap-0.5 border-l pl-2">
          {group.items.map((leaf) => {
            const active = pathname === leaf.href || pathname.startsWith(leaf.href + "/");
            return (
              <Link
                key={leaf.href}
                href={leaf.href}
                onClick={onNavigate}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {leaf.label}
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {NAV.map((section) => (
        <div key={section.label}>
          <h4 className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </h4>
          <div className="flex flex-col gap-0.5">
            {section.entries.map((entry) =>
              isGroup(entry) ? (
                <Group key={entry.label} group={entry} onNavigate={onNavigate} />
              ) : (
                <Leaf key={entry.href} item={entry} onNavigate={onNavigate} />
              )
            )}
          </div>
        </div>
      ))}
    </nav>
  );
}
