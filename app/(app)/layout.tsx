import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { NAV, filterNavByPermissions } from "@/components/layout/nav-config";
import { Toaster } from "@/components/ui/sonner";
import { ensureAdminBootstrap } from "@/lib/bootstrap";
import { getCurrentPermissions } from "@/lib/rbac";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const sessionUser = session.user as { id?: string; email?: string } | undefined;
  if (sessionUser?.id && sessionUser.email) {
    await ensureAdminBootstrap(sessionUser.id, sessionUser.email);
  }

  const perms = await getCurrentPermissions();
  const sections = filterNavByPermissions(NAV, perms);

  return (
    <div className="flex h-dvh w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-muted/20 md:flex md:flex-col">
        <div className="flex h-14 shrink-0 items-center border-b px-4">
          <span className="text-base font-semibold">Beverage ERP</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav sections={sections} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar sections={sections} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
