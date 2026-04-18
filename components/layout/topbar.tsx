import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompanySwitcher } from "./company-switcher";
import { signOut } from "@/lib/auth";
import { getCurrentUser, getUserCompanies, getActiveCompanyId } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export async function Topbar() {
  const user = await getCurrentUser();
  const companies = await getUserCompanies();
  const activeId = await getActiveCompanyId();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <CompanySwitcher
        companies={companies.map((c) => ({ id: c.company.id, name: c.company.name }))}
        activeId={activeId}
      />

      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
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
