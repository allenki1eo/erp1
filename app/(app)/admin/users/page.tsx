import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import { listCompanyUsers, listRolesForCompany, removeUserFromCompany } from "@/server/actions/admin";
import { requirePermissionOrRedirect, PERMISSIONS } from "@/lib/rbac";
import { UserDialog } from "./user-dialog";

export default async function AdminUsersPage() {
  await requirePermissionOrRedirect(PERMISSIONS.USER_MANAGE);
  const [rows, roles] = await Promise.all([listCompanyUsers(), listRolesForCompany()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users & access"
        description="Invite team members to this company and assign a role."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/admin/roles">Manage roles</Link></Button>
            <UserDialog roles={roles} />
          </div>
        }
      />

      {roles.length === 0 ? (
        <Card className="p-6 text-sm">
          <p className="text-muted-foreground">
            No roles configured yet. <Link href="/admin/roles" className="text-primary underline">Create roles</Link> before inviting users.
          </p>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState title="No team members yet" description="Invite your first user." action={<UserDialog roles={roles} />} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Sales target</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.userId}>
                  <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    {u.roleName ? <Badge variant="outline">{u.roleName}</Badge> : <span className="text-muted-foreground text-xs">No role</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right font-mono text-xs">
                    {u.salesTargetMonthly ? u.salesTargetMonthly.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    {u.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserDialog
                      roles={roles}
                      user={{
                        userId: u.userId,
                        name: u.name,
                        email: u.email,
                        roleId: u.roleId,
                        salesTargetMonthly: u.salesTargetMonthly,
                        isActive: u.isActive,
                      }}
                    />
                    <DeleteButton
                      id={u.userId}
                      action={removeUserFromCompany}
                      confirmMessage="Remove this user from the company? Their login is preserved."
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
