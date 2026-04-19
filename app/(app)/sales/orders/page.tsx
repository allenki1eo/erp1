import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listOrders, listCustomersForSelect, listFinishedGoodsForSelect, listWarehousesForSales, listRoutesForSelect } from "@/server/actions/sales";
import { OrderDialog } from "./order-dialog";

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  CONFIRMED: "warning",
  PICKED: "warning",
  DELIVERED: "success",
  INVOICED: "success",
  CANCELLED: "destructive",
};

export default async function OrdersPage() {
  const [rows, customers, products, warehouses, routes] = await Promise.all([
    listOrders(),
    listCustomersForSelect(),
    listFinishedGoodsForSelect(),
    listWarehousesForSales(),
    listRoutesForSelect(),
  ]);

  const action = <OrderDialog customers={customers} warehouses={warehouses} routes={routes} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales Orders"
        description="Customer orders from draft through invoicing."
        action={action}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Create the first sales order. Lines and customers can be added after."
          action={action}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ order, customer }) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-medium">{order.number}</TableCell>
                  <TableCell>
                    <div>{customer?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{customer?.code ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(order.orderDate)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[order.status] ?? "outline"}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/sales/orders/${order.id}`}>Open</Link>
                    </Button>
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
