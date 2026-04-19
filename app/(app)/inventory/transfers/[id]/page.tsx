import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/crud/delete-button";
import { ActionButton } from "@/components/crud/action-button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getTransfer, deleteTransferLine, confirmTransfer } from "@/server/actions/inventory";
import { listProductsForSelect, listWarehousesForSelect } from "@/server/actions/procurement";
import { TransferLineDialog } from "./transfer-line-dialog";

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  IN_TRANSIT: "warning",
  RECEIVED: "success",
  CANCELLED: "destructive",
};

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, products, warehouses] = await Promise.all([
    getTransfer(id),
    listProductsForSelect(),
    listWarehousesForSelect(),
  ]);

  if (!data) return notFound();

  const { transfer: t, lines } = data;

  const fromWarehouse = warehouses.find((w) => w.id === t.fromWarehouseId);
  const toWarehouse = warehouses.find((w) => w.id === t.toWarehouseId);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/inventory/transfers">
          <ArrowLeft className="size-4" /> Transfers
        </Link>
      </Button>

      {/* Header card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="font-mono text-lg">{t.number}</CardTitle>
                <Badge variant={STATUS_VARIANTS[t.status] ?? "outline"}>
                  {t.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{fromWarehouse?.name ?? t.fromWarehouseId}</span>
                <ArrowRight className="size-3" />
                <span className="font-medium">{toWarehouse?.name ?? t.toWarehouseId}</span>
              </div>
              {t.transferredAt && (
                <p className="text-sm text-muted-foreground">
                  Transferred: {formatDate(t.transferredAt)}
                </p>
              )}
              {t.createdAt && (
                <p className="text-xs text-muted-foreground">
                  Created: {formatDate(t.createdAt)}
                </p>
              )}
            </div>
            {t.status === "DRAFT" && (
              <ActionButton
                action={confirmTransfer.bind(null, t.id)}
                successMessage="Transfer confirmed"
              >
                Confirm Transfer
              </ActionButton>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Lines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Lines ({lines.length})
          </h2>
          {t.status === "DRAFT" && (
            <TransferLineDialog transferId={t.id} products={products} />
          )}
        </div>

        {lines.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No lines yet. Add a product line above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Line Value</TableHead>
                  {t.status === "DRAFT" && <TableHead className="w-16 text-right">Del</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(({ line, product, batch }) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="font-medium">{product?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {product?.sku ?? ""}
                        {product?.uom ? ` · ${product.uom}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {batch?.lotNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(line.qty ?? 0, 2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.unitCost ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency((line.qty ?? 0) * (line.unitCost ?? 0))}
                    </TableCell>
                    {t.status === "DRAFT" && (
                      <TableCell className="text-right">
                        <DeleteButton id={line.id} action={deleteTransferLine} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Totals row */}
        {lines.length > 0 && (
          <div className="flex justify-end pr-1">
            <p className="text-sm font-medium">
              Total:{" "}
              <span className="text-base font-bold">
                {formatCurrency(
                  lines.reduce(
                    (s, { line }) => s + (line.qty ?? 0) * (line.unitCost ?? 0),
                    0
                  )
                )}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
