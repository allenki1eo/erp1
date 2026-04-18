import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatNumber } from "@/lib/utils";
import { getActiveCompanyId } from "@/lib/tenant";
import { canSeeAllCompaniesTransport } from "@/lib/rbac";
import { listFuelStations, deleteFuelStation } from "@/server/actions/transport";
import { listAccessibleCompanies } from "@/server/actions/company-list";
import { FuelStationDialog } from "./fuel-station-dialog";

export default async function FuelStationsPage() {
  const [rows, companies, activeId, crossCompany] = await Promise.all([
    listFuelStations(),
    listAccessibleCompanies(),
    getActiveCompanyId(),
    canSeeAllCompaniesTransport(),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Fuel stations"
        description="Internal (on-premises) and external stations used by the fleet."
        action={<FuelStationDialog companies={companies} defaultCompanyId={activeId} />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No stations yet"
          description="Add your internal station and any regular external ones."
          action={<FuelStationDialog companies={companies} defaultCompanyId={activeId} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {crossCompany && <TableHead>Company</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead className="hidden md:table-cell text-right">Capacity (L)</TableHead>
                <TableHead className="text-right">Volume (L)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ station, company }) => {
                const pct = station.tankCapacityLitres
                  ? (station.currentVolumeLitres / station.tankCapacityLitres) * 100
                  : null;
                const low = pct !== null && pct < 20;
                return (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    {crossCompany && <TableCell className="text-sm text-muted-foreground">{company?.name ?? "—"}</TableCell>}
                    <TableCell>
                      <Badge variant={station.type === "INTERNAL" ? "default" : "secondary"}>
                        {station.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{station.fuelType}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      {station.tankCapacityLitres ? formatNumber(station.tankCapacityLitres, 0) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={low ? "font-medium text-destructive" : ""}>
                        {formatNumber(station.currentVolumeLitres, 0)}
                        {pct !== null ? ` (${Math.round(pct)}%)` : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      {station.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <FuelStationDialog station={station} companies={companies} />
                      <DeleteButton id={station.id} action={deleteFuelStation} />
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
