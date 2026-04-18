import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { listBinLocations, deleteBinLocation } from "@/server/actions/inventory";
import { listWarehousesForSelect } from "@/server/actions/procurement";
import { BinDialog } from "./bin-dialog";

export default async function BinsPage() {
  const [rows, warehouses] = await Promise.all([
    listBinLocations(),
    listWarehousesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bin Locations"
        description="Storage locations within warehouses (zones, rows, bays)."
        action={<BinDialog warehouses={warehouses} />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No bin locations yet"
          description="Create bin locations to track stock at sub-warehouse level."
          action={<BinDialog warehouses={warehouses} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ bin, warehouse }) => (
                <TableRow key={bin.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {warehouse?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium">
                    {bin.code}
                  </TableCell>
                  <TableCell className="text-sm">{bin.name ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {bin.zone ? (
                      <Badge variant="outline">{bin.zone}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={bin.isActive ? "success" : "secondary"}>
                      {bin.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <BinDialog bin={bin} warehouses={warehouses} />
                    <DeleteButton id={bin.id} action={deleteBinLocation} />
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
