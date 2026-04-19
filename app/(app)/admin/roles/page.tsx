import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { ActionButton } from "@/components/crud/action-button";
import { listRolesForCompany, deleteRole, seedRolePresets } from "@/server/actions/admin";
import { RoleDialog } from "./role-dialog";

export default async function AdminRolesPage() {
  const roles = await listRolesForCompany();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles & permissions"
        description="Fine-grained access control. Each user gets one role per company."
        action={
          <div className="flex gap-2">
            <ActionButton
              action={seedRolePresets}
              variant="outline"
              size="sm"
              successMessage="Preset roles added"
            >
              Seed presets
            </ActionButton>
            <RoleDialog />
          </div>
        }
      />

      {roles.length === 0 ? (
        <EmptyState
          title="No roles yet"
          description='Click "Seed presets" to add ADMIN, PLANT_MANAGER, SALES_REP, FINANCE, etc., or create a custom role.'
          action={<RoleDialog />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => {
                const perms = (r.permissions ?? []) as string[];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      {perms.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No permissions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {perms.slice(0, 8).map((p) => (
                            <Badge key={p} variant="outline" className="text-[10px] font-mono">{p}</Badge>
                          ))}
                          {perms.length > 8 && (
                            <Badge variant="secondary" className="text-[10px]">+{perms.length - 8}</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RoleDialog role={{ id: r.id, name: r.name, permissions: perms }} />
                      <DeleteButton
                        id={r.id}
                        action={deleteRole}
                        confirmMessage={`Delete role "${r.name}"? Users assigned to it must be reassigned first.`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
