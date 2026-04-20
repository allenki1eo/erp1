import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompanySwitcher } from "./company-switcher";
import { MobileNav } from "./mobile-nav";
import { signOut } from "@/lib/auth";
import { getCurrentUser, getUserCompanies, getActiveCompanyId } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { NavSection } from "./nav-config";

export async function Topbar({ sections }: { sections: NavSection[] }) {
  const user = await getCurrentUser();
  const companies = await getUserCompanies();
  const activeId = await getActiveCompanyId();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background px-3 sm:px-6">
      <div className="flex items-center gap-2 min-w-0">
        <MobileNav sections={sections} />
        <CompanySwitcher
          companies={companies.map((c) => ({ id: c.company.id, name: c.company.name }))}
          activeId={activeId}
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right text-sm sm:block">
          <div className="font-medium">{user?.name ?? user?.email}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
        <Avatar>
          <AvatarFallback>
            {(user?.name ?? user?.email ?? "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button variant="ghost" size="icon" type="submit" title="Sign out">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
