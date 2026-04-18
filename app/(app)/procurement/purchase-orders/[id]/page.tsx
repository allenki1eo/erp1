import { notFound } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/crud/delete-button";
import { SubmitButton } from "@/components/crud/submit-button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import {
  getPO,
  approvePO,
  deletePOLine,
  listProductsForSelect,
  listSuppliersForSelect,
  listWarehousesForSelect,
} from "@/server/actions/procurement";
import { PODialog } from "../po-dialog";
import { POLineDialog } from "../po-line-dialog";
import { ArrowLeft } from "lucide-react";

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

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, products, suppliers, warehouses] = await Promise.all([
    getPO(id),
    listProductsForSelect(),
    listSuppliersForSelect(),
    listWarehousesForSelect(),
  ]);
  if (!data) notFound();

  const { po, supplier, warehouse, lines } = data;
  const canEdit = po.status === "DRAFT";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Purchase Order ${po.number}`}
        description={supplier?.name ?? ""}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/procurement/purchase-orders">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        }
      />

      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Order Details</CardTitle>
            <POStatusBadge status={po.status} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Number</dt>
              <dd className="font-mono font-medium">{po.number}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Supplier</dt>
              <dd>{supplier?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Warehouse</dt>
              <dd>{warehouse?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Currency</dt>
              <dd>{po.currency ?? "TZS"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Order Date</dt>
              <dd>{po.orderDate ? formatDate(po.orderDate) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expected Date</dt>
              <dd>{po.expectedDate ? formatDate(po.expectedDate) : "—"}</dd>
            </div>
          </dl>
          {po.notes && (
            <p className="mt-3 text-sm text-muted-foreground">{po.notes}</p>
          )}

          <div className="mt-4 flex gap-2">
            {canEdit && (
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
            )}
            {po.status === "DRAFT" && (
              <form action={approvePO.bind(null, po.id)}>
                <SubmitButton size="sm">Approve PO</SubmitButton>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Line Items ({lines.length})</CardTitle>
            {canEdit && <POLineDialog poId={po.id} products={products} />}
          </div>
        </CardHeader>
        {lines.length === 0 ? (
          <CardContent>
            <p className="py-6 text-center text-sm text-muted-foreground">No lines yet. Add items to this order.</p>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="hidden sm:table-cell">UOM</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Tax %</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Received</TableHead>
                  {canEdit && <TableHead className="w-20 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(({ line, product }) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-sm">
                      {product ? (
                        <span>
                          <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>{" "}
                          <span className="font-medium">{product.name}</span>
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {line.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(line.qty, 3)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{product?.uom ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatNumber(line.taxRate * 100, 2)}%</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(line.lineTotal)}</TableCell>
                    <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                      {formatNumber(line.qtyReceived, 3)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <POLineDialog poId={po.id} line={line} products={products} />
                        <DeleteButton id={line.id} action={deletePOLine} confirmMessage="Delete this line?" />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="border-t p-4">
              <div className="ml-auto max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(po.subtotal, po.currency ?? "TZS")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(po.taxTotal, po.currency ?? "TZS")}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(po.total, po.currency ?? "TZS")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
