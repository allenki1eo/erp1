import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { listStockBalances } from "@/server/actions/inventory";

export default async function StockPage() {
  const rows = await listStockBalances();

  const totalSkus = rows.length;
  const totalValue = rows.reduce((sum, { balance, product }) => {
    const qty = balance.qty ?? 0;
    const cost = balance.unitCost ?? 0;
    return sum + qty * cost;
  }, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Balance"
        description="Current inventory across all warehouses."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total SKUs</p>
            <p className="text-2xl font-bold">{formatNumber(totalSkus, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Warehouse Value</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No stock yet"
          description="Stock balances will appear here once goods are received."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead className="text-right">Unit Cost (TZS)</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ balance, product, warehouse }) => {
                const qty = balance.qty ?? 0;
                const cost = balance.unitCost ?? 0;
                const totalVal = qty * cost;
                const belowReorder =
                  product?.reorderLevel != null && qty < product.reorderLevel;
                return (
                  <TableRow key={balance.id}>
                    <TableCell className="font-mono text-xs">
                      {product?.sku ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {warehouse?.name ?? "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${belowReorder ? "text-destructive" : ""}`}
                    >
                      {formatNumber(qty, 2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product?.uom ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(cost, 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(totalVal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
