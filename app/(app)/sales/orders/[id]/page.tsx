import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/crud/delete-button";
import { ActionButton } from "@/components/crud/action-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getOrder, deleteOrderLine, confirmOrder, invoiceOrder, cancelOrder,
  listFinishedGoodsForSelect,
} from "@/server/actions/sales";
import { OrderLineDialog } from "../order-line-dialog";

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  CONFIRMED: "warning",
  PICKED: "warning",
  DELIVERED: "success",
  INVOICED: "success",
  CANCELLED: "destructive",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, products] = await Promise.all([
    getOrder(id),
    listFinishedGoodsForSelect(),
  ]);
  if (!data) notFound();
  const { order, lines, customer } = data;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/sales/orders"><ArrowLeft className="size-4" /> Orders</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="font-mono text-lg">{order.number}</CardTitle>
                <Badge variant={STATUS_VARIANTS[order.status] ?? "outline"}>{order.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {customer?.name ?? "—"} · {formatDate(order.orderDate)}
                {order.deliveryDate && <> · deliver {formatDate(order.deliveryDate)}</>}
              </p>
              {order.notes && <p className="text-sm text-muted-foreground">{order.notes}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {order.status === "DRAFT" && lines.length > 0 && (
                <ActionButton action={confirmOrder.bind(null, order.id)} size="sm" successMessage="Order confirmed">
                  Confirm
                </ActionButton>
              )}
              {(order.status === "CONFIRMED" || order.status === "DELIVERED" || order.status === "PICKED") && (
                <ActionButton action={invoiceOrder.bind(null, order.id)} size="sm" successMessage="Invoice created">
                  Invoice
                </ActionButton>
              )}
              {order.status !== "CANCELLED" && order.status !== "INVOICED" && (
                <ActionButton
                  action={cancelOrder.bind(null, order.id)}
                  variant="outline"
                  size="sm"
                  successMessage="Order cancelled"
                  confirmMessage="Cancel this order?"
                >
                  Cancel
                </ActionButton>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lines ({lines.length})</CardTitle>
            {order.status === "DRAFT" && <OrderLineDialog orderId={order.id} products={products} />}
          </div>
        </CardHeader>
        {lines.length === 0 ? (
          <CardContent>
            <p className="py-6 text-center text-sm text-muted-foreground">
              No lines yet. Add at least one product before confirming.
            </p>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(({ line, product }) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="font-medium">{product?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{product?.sku ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-right">{line.qty}</TableCell>
                    <TableCell>{line.uom}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.discount ?? 0)}</TableCell>
                    <TableCell className="text-right text-xs">{(line.taxRate * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(line.lineTotal)}</TableCell>
                    <TableCell className="text-right">
                      {order.status === "DRAFT" && (
                        <DeleteButton id={line.id} action={deleteOrderLine} confirmMessage="Delete line?" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-3 text-right text-sm">
              <div>Subtotal: <span className="font-medium">{formatCurrency(order.subtotal)}</span></div>
              <div>Tax: <span className="font-medium">{formatCurrency(order.taxTotal)}</span></div>
              <div className="text-base">Total: <span className="font-bold">{formatCurrency(order.total)}</span></div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
