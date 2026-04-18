import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { listStockBatches } from "@/server/actions/inventory";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  AVAILABLE: "success",
  ON_HOLD: "warning",
  QUARANTINE: "destructive",
  EXPIRED: "secondary",
  DEPLETED: "secondary",
};

function expiryClass(expiryDate: Date | string | null | undefined): string {
  if (!expiryDate) return "";
  const d = new Date(expiryDate);
  const now = new Date();
  if (d < now) return "text-destructive font-medium";
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (d < in30) return "text-warning font-medium";
  return "";
}

export default async function BatchesPage() {
  const rows = await listStockBatches();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lots & Batches"
        description="FEFO batch tracking with expiry dates."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No batches yet"
          description="Batches with qty > 0 will appear here once goods are received."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot #</TableHead>
                <TableHead>Batch #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="hidden md:table-cell">Bin</TableHead>
                <TableHead className="text-right">Qty on Hand</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Unit Cost</TableHead>
                <TableHead className="hidden md:table-cell">Mfg Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ batch, product, warehouse, bin }) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono text-xs">
                    {batch.lotNumber ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {batch.batchNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {product?.sku ?? ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {warehouse?.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">
                    {bin?.code ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(batch.qtyOnHand ?? 0, 2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product?.uom ?? "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {formatCurrency(batch.unitCost ?? 0)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {batch.manufacturedOn ? formatDate(batch.manufacturedOn) : "—"}
                  </TableCell>
                  <TableCell className={`text-sm ${expiryClass(batch.expiryDate)}`}>
                    {batch.expiryDate ? formatDate(batch.expiryDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[batch.status ?? ""] ?? "outline"}>
                      {(batch.status ?? "—").replace("_", " ")}
                    </Badge>
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
