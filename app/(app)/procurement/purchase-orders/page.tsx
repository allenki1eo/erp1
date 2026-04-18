import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  listPOs,
  deletePO,
  listSuppliersForSelect,
  listWarehousesForSelect,
} from "@/server/actions/procurement";
import { PODialog } from "./po-dialog";
import { Eye } from "lucide-react";

function POStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "secondary" | "success" | "outline" | "warning" | "destructive"> = {
    DRAFT: "secondary",
    APPROVED: "success",
    SENT: "outline",
    PARTIAL: "warning",
    RECEIVED: "success",
    CANCELLED: "destructive",
  };
  return (
    <Badge variant={variants[status] ?? "secondary"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export default async function PurchaseOrdersPage() {
  const [rows, suppliers, warehouses] = await Promise.all([
    listPOs(),
    listSuppliersForSelect(),
    listWarehousesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Purchase Orders"
        description="Manage supplier purchase orders."
        action={<PODialog suppliers={suppliers} warehouses={warehouses} />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No purchase orders yet"
          description="Create your first purchase order to start procuring goods."
          action={<PODialog suppliers={suppliers} warehouses={warehouses} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="hidden md:table-cell">Order Date</TableHead>
                <TableHead className="hidden md:table-cell">Expected</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ po, supplier, lineCount }) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-xs font-medium">{po.number}</TableCell>
                  <TableCell className="text-sm">
                    {supplier ? (
                      <span>
                        <span className="text-muted-foreground">{supplier.code}</span>{" "}
                        {supplier.name}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell><POStatusBadge status={po.status} /></TableCell>
                  <TableCell className="text-right">{lineCount}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {po.orderDate ? formatDate(po.orderDate) : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {po.expectedDate ? formatDate(po.expectedDate) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(po.total, po.currency ?? "TZS")}
                  </TableCell>
                  <TableCell className="text-right">
                    <PODialog
                      po={{
                        id: po.id,
                        supplierId: po.supplierId,
                        warehouseId: po.warehouseId ?? null,
                        orderDate: po.orderDate,
                        expectedDate: po.expectedDate ?? null,
                        notes: po.notes ?? null,
                      }}
                      suppliers={suppliers}
                      warehouses={warehouses}
                    />
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/procurement/purchase-orders/${po.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    {po.status === "DRAFT" && (
                      <DeleteButton id={po.id} action={deletePO} confirmMessage="Delete this purchase order?" />
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
