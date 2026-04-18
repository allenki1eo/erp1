import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import { canSeeAllCompaniesTransport } from "@/lib/rbac";
import { listVehicleDocuments, listVehicles, deleteVehicleDocument } from "@/server/actions/transport";
import { DocumentDialog } from "./document-dialog";

function expiryBadge(expiresOn: Date | null) {
  if (!expiresOn) return <Badge variant="secondary">No expiry</Badge>;
  const now = Date.now();
  const ms = new Date(expiresOn).getTime() - now;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return <Badge variant="destructive">Expired</Badge>;
  if (days <= 30) return <Badge variant="warning">{days}d left</Badge>;
  return <Badge variant="success">{days}d left</Badge>;
}

export default async function DocumentsPage() {
  const [rows, vehiclesRaw, crossCompany] = await Promise.all([
    listVehicleDocuments(),
    listVehicles(),
    canSeeAllCompaniesTransport(),
  ]);
  const vehicles = vehiclesRaw.map(({ vehicle: v }) => ({
    id: v.id, registrationNumber: v.registrationNumber, ownerCompanyId: v.ownerCompanyId,
  }));
  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicle documents"
        description={crossCompany ? "Insurance, TLB, fitness across all companies." : "Compliance documents for your fleet."}
        action={<DocumentDialog vehicles={vehicles} />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Track insurance, TLB, inspection, fitness and road licences."
          action={<DocumentDialog vehicles={vehicles} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                {crossCompany && <TableHead>Company</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Number</TableHead>
                <TableHead className="hidden md:table-cell">Issuer</TableHead>
                <TableHead className="hidden sm:table-cell">Issued</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ doc, vehicle, company }) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-xs">{vehicle?.registrationNumber ?? "—"}</TableCell>
                  {crossCompany && <TableCell className="text-sm text-muted-foreground">{company?.name ?? "—"}</TableCell>}
                  <TableCell><Badge variant="outline">{doc.type.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{doc.number ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{doc.issuer ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{doc.issuedOn ? formatDate(doc.issuedOn) : "—"}</TableCell>
                  <TableCell className="text-sm">{doc.expiresOn ? formatDate(doc.expiresOn) : "—"}</TableCell>
                  <TableCell>{expiryBadge(doc.expiresOn)}</TableCell>
                  <TableCell className="text-right">
                    <DocumentDialog doc={doc} vehicles={vehicles} />
                    <DeleteButton id={doc.id} action={deleteVehicleDocument} />
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
