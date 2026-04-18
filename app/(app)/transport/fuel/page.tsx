import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getActiveCompanyId } from "@/lib/tenant";
import { canSeeAllCompaniesTransport } from "@/lib/rbac";
import { listFuelLogs, listVehicles, listDrivers, listFuelStations, deleteFuelLog } from "@/server/actions/transport";
import { listAccessibleCompanies } from "@/server/actions/company-list";
import { FuelDialog } from "./fuel-dialog";

export default async function FuelPage() {
  const [rows, vehiclesRaw, driversRaw, stationsRaw, companies, activeId, crossCompany] = await Promise.all([
    listFuelLogs(),
    listVehicles(),
    listDrivers(),
    listFuelStations(),
    listAccessibleCompanies(),
    getActiveCompanyId(),
    canSeeAllCompaniesTransport(),
  ]);
  const vehicles = vehiclesRaw.map(({ vehicle: v }) => ({
    id: v.id, registrationNumber: v.registrationNumber, ownerCompanyId: v.ownerCompanyId,
  }));
  const drivers = driversRaw.map(({ driver: d }) => ({
    id: d.id, fullName: d.fullName, ownerCompanyId: d.ownerCompanyId,
  }));
  const fuelStationsList = stationsRaw.map(({ station: s }) => ({
    id: s.id, name: s.name, type: s.type, ownerCompanyId: s.ownerCompanyId,
  }));
  return (
    <div className="space-y-4">
      <PageHeader
        title="Fuel logs"
        description={crossCompany ? "Fuel entries across all companies." : "Fuel entries for the active company."}
        action={<FuelDialog vehicles={vehicles} drivers={drivers} fuelStationsList={fuelStationsList} companies={companies} defaultCompanyId={activeId} />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No fuel logs yet"
          description="Record the first fill-up to start tracking consumption."
          action={<FuelDialog vehicles={vehicles} drivers={drivers} fuelStationsList={fuelStationsList} companies={companies} defaultCompanyId={activeId} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                {crossCompany && <TableHead>Company</TableHead>}
                <TableHead className="hidden md:table-cell">Driver</TableHead>
                <TableHead className="hidden md:table-cell">Station</TableHead>
                <TableHead className="text-right">Litres</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Price/L</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden md:table-cell text-right">Odometer</TableHead>
                <TableHead>Full</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ log, vehicle, driver, company }) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{formatDate(log.filledAt)}</TableCell>
                  <TableCell className="font-mono text-xs">{vehicle?.registrationNumber ?? "—"}</TableCell>
                  {crossCompany && <TableCell className="text-sm text-muted-foreground">{company?.name ?? "—"}</TableCell>}
                  <TableCell className="hidden md:table-cell text-sm">{driver?.fullName ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {log.stationType === "INTERNAL"
                      ? <span className="text-blue-600 font-medium">Internal</span>
                      : log.station ?? "External"}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(log.litres, 2)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-right">{formatNumber(log.pricePerLitre, 0)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(log.totalCost)}</TableCell>
                  <TableCell className="hidden md:table-cell text-right">{formatNumber(log.odometer, 0)}</TableCell>
                  <TableCell>
                    {log.isFullTank ? <Badge variant="success">Full</Badge> : <Badge variant="secondary">Partial</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <FuelDialog log={log} vehicles={vehicles} drivers={drivers} fuelStationsList={fuelStationsList} companies={companies} />
                    <DeleteButton id={log.id} action={deleteFuelLog} />
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
