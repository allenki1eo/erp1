import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import { getActiveCompanyId } from "@/lib/tenant";
import { canSeeAllCompaniesTransport } from "@/lib/rbac";
import { listDrivers, deleteDriver } from "@/server/actions/transport";
import { listAccessibleCompanies } from "@/server/actions/company-list";
import { DriverDialog } from "./driver-dialog";

export default async function DriversPage() {
  const [rows, companies, activeId, crossCompany] = await Promise.all([
    listDrivers(),
    listAccessibleCompanies(),
    getActiveCompanyId(),
    canSeeAllCompaniesTransport(),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Drivers"
        description={crossCompany ? "Drivers across all companies." : "Drivers for the active company."}
        action={<DriverDialog companies={companies} defaultCompanyId={activeId} />}
      />
      {rows.length === 0 ? (
        <EmptyState title="No drivers yet" action={<DriverDialog companies={companies} defaultCompanyId={activeId} />} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {crossCompany && <TableHead>Company</TableHead>}
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>License</TableHead>
                <TableHead className="hidden md:table-cell">Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ driver: d, company }) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.fullName}</TableCell>
                  {crossCompany && <TableCell className="text-sm text-muted-foreground">{company?.name ?? "—"}</TableCell>}
                  <TableCell className="hidden md:table-cell">{d.phone ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{d.licenseNumber}{d.licenseClass ? ` · ${d.licenseClass}` : ""}</TableCell>
                  <TableCell className="hidden md:table-cell">{d.licenseExpiry ? formatDate(d.licenseExpiry) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "ACTIVE" ? "success" : "secondary"}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DriverDialog driver={d} companies={companies} />
                    <DeleteButton id={d.id} action={deleteDriver} />
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
