import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getActiveCompanyId } from "@/lib/tenant";
import { canSeeAllCompaniesTransport } from "@/lib/rbac";
import { listMaintenance, listVehicles, deleteMaintenance } from "@/server/actions/transport";
import { listAccessibleCompanies } from "@/server/actions/company-list";
import { MaintenanceDialog } from "./maintenance-dialog";

function statusVariant(s: string) {
  switch (s) {
    case "COMPLETED": return "success" as const;
    case "IN_PROGRESS": return "warning" as const;
    case "CANCELLED": return "destructive" as const;
    default: return "secondary" as const;
  }
}

export default async function MaintenancePage() {
  const [rows, vehiclesRaw, companies, activeId, crossCompany] = await Promise.all([
    listMaintenance(),
    listVehicles(),
    listAccessibleCompanies(),
    getActiveCompanyId(),
    canSeeAllCompaniesTransport(),
  ]);
  const vehicles = vehiclesRaw.map(({ vehicle: v }) => ({
    id: v.id, registrationNumber: v.registrationNumber, ownerCompanyId: v.ownerCompanyId,
  }));
  return (
    <div className="space-y-4">
      <PageHeader
        title="Maintenance"
        description={crossCompany ? "Service records across all companies." : "Service records for the active company."}
        action={<MaintenanceDialog vehicles={vehicles} companies={companies} defaultCompanyId={activeId} />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No maintenance records"
          description="Plan a routine service or log a repair."
          action={<MaintenanceDialog vehicles={vehicles} companies={companies} defaultCompanyId={activeId} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                {crossCompany && <TableHead>Company</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Scheduled</TableHead>
                <TableHead className="hidden md:table-cell">Performed</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ rec, vehicle, company }) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-mono text-xs">{vehicle?.registrationNumber ?? "—"}</TableCell>
                  {crossCompany && <TableCell className="text-sm text-muted-foreground">{company?.name ?? "—"}</TableCell>}
                  <TableCell><Badge variant="outline">{rec.type}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate">{rec.description}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{rec.scheduledFor ? formatDate(rec.scheduledFor) : "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{rec.performedAt ? formatDate(rec.performedAt) : "—"}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(rec.totalCost)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(rec.status)}>{rec.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <MaintenanceDialog record={rec} vehicles={vehicles} companies={companies} />
                    <DeleteButton id={rec.id} action={deleteMaintenance} />
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
