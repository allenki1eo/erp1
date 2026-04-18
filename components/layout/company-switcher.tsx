"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { switchCompany } from "@/server/actions/company";

export function CompanySwitcher({
  companies,
  activeId,
}: {
  companies: { id: string; name: string }[];
  activeId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const active = companies.find((c) => c.id === activeId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={pending}>
          <Building2 className="size-4" />
          {active?.name ?? "Select company"}
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[14rem]">
        <DropdownMenuLabel>Switch company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.length === 0 && (
          <DropdownMenuItem disabled>No companies assigned</DropdownMenuItem>
        )}
        {companies.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onSelect={() => {
              startTransition(async () => {
                await switchCompany(c.id);
                router.refresh();
              });
            }}
          >
            {c.name} {c.id === activeId && <span className="ml-auto text-xs">●</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
