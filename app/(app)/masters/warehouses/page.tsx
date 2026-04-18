import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { listWarehouses, deleteWarehouse } from "@/server/actions/warehouses";
import { WarehouseDialog } from "./warehouse-dialog";

export default async function WarehousesPage() {
  const rows = await listWarehouses();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Warehouses"
        description="Storage locations including bonded warehouses."
        action={<WarehouseDialog />}
      />
      {rows.length === 0 ? (
        <EmptyState title="No warehouses yet" description="Create your first storage location." action={<WarehouseDialog />} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs">{w.code}</TableCell>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell><Badge variant="outline">{w.type}</Badge></TableCell>
                  <TableCell>
                    {w.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <WarehouseDialog warehouse={w} />
                    <DeleteButton id={w.id} action={deleteWarehouse} />
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
