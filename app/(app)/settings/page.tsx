import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser, getCurrentRole } from "@/lib/tenant";
import { getActiveCompany } from "@/server/actions/companies";
import { PERMISSIONS } from "@/lib/rbac";

export default async function SettingsPage() {
  const [user, company, role] = await Promise.all([
    getCurrentUser(),
    getActiveCompany(),
    getCurrentRole(),
  ]);

  const perms = (role?.permissions ?? []) as string[];
  const allPerms = Object.values(PERMISSIONS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Session info, tenant configuration, and quick links to admin areas."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Signed in as
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {user?.name ?? "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {user?.email ?? "—"}</div>
            <div>
              <span className="text-muted-foreground">Role:</span>{" "}
              {role ? <Badge variant="outline">{role.name}</Badge> : <span className="text-xs">No role</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Active company
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {company ? (
              <>
                <div className="font-medium">{company.name}</div>
                <div className="text-xs text-muted-foreground">
                  {company.legalName ?? "—"} · TIN {company.tin ?? "—"} · VRN {company.vrn ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {company.country} · {company.baseCurrency}
                </div>
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <Link href="/masters/companies">Edit company</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">No active company.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your permissions ({perms.length} / {allPerms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {perms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No permissions granted.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {perms.map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] font-mono">{p}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Administration
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" asChild>
            <Link href="/admin/users">Manage users</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/roles">Roles & permissions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/excise/rates">Excise rates</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/masters/companies">Company details</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
