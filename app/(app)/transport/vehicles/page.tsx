import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatNumber } from "@/lib/utils";
import { getActiveCompanyId } from "@/lib/tenant";
import { canSeeAllCompaniesTransport } from "@/lib/rbac";
import { listVehicles, deleteVehicle } from "@/server/actions/transport";
import { listAccessibleCompanies } from "@/server/actions/company-list";
import { VehicleDialog } from "./vehicle-dialog";

export default async function VehiclesPage() {
  const [rows, companies, activeId, crossCompany] = await Promise.all([
    listVehicles(),
    listAccessibleCompanies(),
    getActiveCompanyId(),
    canSeeAllCompaniesTransport(),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicles"
        description={crossCompany ? "Fleet across all companies." : "Fleet for the active company."}
        action={<VehicleDialog companies={companies} defaultCompanyId={activeId} />}
      />
      {rows.length === 0 ? (
        <EmptyState title="No vehicles yet" action={<VehicleDialog companies={companies} defaultCompanyId={activeId} />} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg.</TableHead>
                <TableHead>Make / Model</TableHead>
                {crossCompany && <TableHead>Company</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Fuel</TableHead>
                <TableHead className="hidden md:table-cell text-right">Odometer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ vehicle: v, company }) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.registrationNumber}</TableCell>
                  <TableCell className="font-medium">
                    {v.make}{v.model ? ` ${v.model}` : ""}{v.year ? ` (${v.year})` : ""}
                  </TableCell>
                  {crossCompany && <TableCell className="text-sm text-muted-foreground">{company?.name ?? "—"}</TableCell>}
                  <TableCell><Badge variant="outline">{v.type}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell">{v.fuelType}</TableCell>
                  <TableCell className="hidden md:table-cell text-right">{formatNumber(v.currentOdometer, 0)} km</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "ACTIVE" ? "success" : v.status === "IN_MAINTENANCE" ? "warning" : "secondary"}>
                      {v.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <VehicleDialog vehicle={v} companies={companies} />
                    <DeleteButton id={v.id} action={deleteVehicle} />
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
