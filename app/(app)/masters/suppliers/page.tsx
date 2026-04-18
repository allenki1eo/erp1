import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { listSuppliers, deleteSupplier } from "@/server/actions/suppliers";
import { SupplierDialog } from "./supplier-dialog";

export default async function SuppliersPage() {
  const rows = await listSuppliers();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        description="Raw material and packaging vendors."
        action={<SupplierDialog />}
      />
      {rows.length === 0 ? (
        <EmptyState title="No suppliers yet" description="Add your first supplier." action={<SupplierDialog />} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">TIN</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Terms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.tin ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.phone ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.paymentTerms ?? 0} days</TableCell>
                  <TableCell>
                    {s.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <SupplierDialog supplier={s} />
                    <DeleteButton id={s.id} action={deleteSupplier} />
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
