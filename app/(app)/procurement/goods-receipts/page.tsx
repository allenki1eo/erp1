import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import {
  listGRNs,
  deleteGRN,
  listSuppliersForSelect,
  listWarehousesForSelect,
  listPOs,
} from "@/server/actions/procurement";
import { GRNDialog } from "./grn-dialog";
import { Eye } from "lucide-react";

function GRNStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "CONFIRMED" ? "success" : "secondary"}>
      {status}
    </Badge>
  );
}

export default async function GoodsReceiptsPage() {
  const [rows, suppliers, warehouses, posRaw] = await Promise.all([
    listGRNs(),
    listSuppliersForSelect(),
    listWarehousesForSelect(),
    listPOs(),
  ]);

  const pos = posRaw.map(({ po }) => ({ id: po.id, number: po.number }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Goods Receipts"
        description="Record and confirm delivery of goods from suppliers."
        action={<GRNDialog suppliers={suppliers} warehouses={warehouses} pos={pos} />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No goods receipts yet"
          description="Create a GRN when goods arrive from a supplier."
          action={<GRNDialog suppliers={suppliers} warehouses={warehouses} pos={pos} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="hidden sm:table-cell">Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Received</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ grn, supplier, warehouse, lineCount }) => (
                <TableRow key={grn.id}>
                  <TableCell className="font-mono text-xs font-medium">{grn.number}</TableCell>
                  <TableCell className="text-sm">{supplier?.name ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {warehouse?.name ?? "—"}
                  </TableCell>
                  <TableCell><GRNStatusBadge status={grn.status} /></TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {grn.receivedDate ? formatDate(grn.receivedDate) : "—"}
                  </TableCell>
                  <TableCell className="text-right">{lineCount}</TableCell>
                  <TableCell className="text-right">
                    {grn.status === "DRAFT" && (
                      <GRNDialog
                        grn={{
                          id: grn.id,
                          supplierId: grn.supplierId,
                          warehouseId: grn.warehouseId,
                          poId: grn.poId ?? null,
                          receivedDate: grn.receivedDate,
                          deliveryNoteNumber: grn.deliveryNoteNumber ?? null,
                          notes: grn.notes ?? null,
                        }}
                        suppliers={suppliers}
                        warehouses={warehouses}
                        pos={pos}
                      />
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/procurement/goods-receipts/${grn.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    {grn.status === "DRAFT" && (
                      <DeleteButton id={grn.id} action={deleteGRN} confirmMessage="Delete this GRN?" />
                    )}
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
