import Link from "next/link";
import { notFound } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/crud/delete-button";
import { ActionButton } from "@/components/crud/action-button";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import {
  getGRN, deleteGRNLine, confirmGRN,
  listProductsForSelect, listSuppliersForSelect, listWarehousesForSelect, listPOs,
} from "@/server/actions/procurement";
import { GRNLineDialog } from "./grn-line-dialog";
import { GRNDialog } from "../grn-dialog";
import { ArrowLeft } from "lucide-react";

export default async function GRNDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, products, suppliers, warehouses, posRaw] = await Promise.all([
    getGRN(id),
    listProductsForSelect(),
    listSuppliersForSelect(),
    listWarehousesForSelect(),
    listPOs(),
  ]);
  if (!data) notFound();
  const { grn, supplier, warehouse, lines } = data;
  const pos = posRaw.map(({ po }) => ({ id: po.id, number: po.number }));
  const isDraft = grn.status === "DRAFT";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Goods Receipt ${grn.number}`}
        description={supplier?.name ?? ""}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/procurement/goods-receipts">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        }
      />

      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Receipt Details</CardTitle>
            <Badge variant={grn.status === "CONFIRMED" ? "success" : "secondary"}>{grn.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Number</dt>
              <dd className="font-mono font-medium">{grn.number}</dd>
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
              <dt className="text-muted-foreground">Received Date</dt>
              <dd>{grn.receivedDate ? formatDate(grn.receivedDate) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivery Note</dt>
              <dd className="font-mono text-xs">{grn.deliveryNoteNumber ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Against PO</dt>
              <dd>
                {grn.poId ? (
                  <Link
                    href={`/procurement/purchase-orders/${grn.poId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    View PO
                  </Link>
                ) : "—"}
              </dd>
            </div>
          </dl>
          {grn.notes && (
            <p className="mt-3 text-sm text-muted-foreground">{grn.notes}</p>
          )}

          <div className="mt-4 flex gap-2">
            {isDraft && (
              <>
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
                {lines.length > 0 && (
                  <ActionButton
                    action={confirmGRN.bind(null, id)}
                    size="sm"
                    successMessage="GRN confirmed"
                  >
                    Confirm GRN
                  </ActionButton>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Receipt Lines ({lines.length})</CardTitle>
            {isDraft && <GRNLineDialog grnId={id} products={products} />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No lines yet. Add items to receive.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Rejected</TableHead>
                  <TableHead className="hidden sm:table-cell">Lot</TableHead>
                  <TableHead className="hidden md:table-cell">Expiry</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Unit Cost</TableHead>
                  <TableHead>QC</TableHead>
                  {isDraft && <TableHead className="w-16 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(({ line, product }) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{product?.name ?? "—"}</div>
                      <div className="font-mono text-xs text-muted-foreground">{product?.sku}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(line.qtyOrdered ?? 0, 3)}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(line.qtyReceived, 3)}</TableCell>
                    <TableCell className="text-right">
                      {line.qtyRejected > 0
                        ? <span className="text-destructive">{formatNumber(line.qtyRejected, 3)}</span>
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs">{line.lotNumber ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {line.expiryDate ? formatDate(line.expiryDate) : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right">{formatCurrency(line.unitCost)}</TableCell>
                    <TableCell>
                      <Badge variant={line.qcPassed ? "success" : "destructive"}>
                        {line.qcPassed ? "Pass" : "Fail"}
                      </Badge>
                    </TableCell>
                    {isDraft && (
                      <TableCell className="text-right">
                        <DeleteButton id={line.id} action={deleteGRNLine} confirmMessage="Delete this line?" />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
