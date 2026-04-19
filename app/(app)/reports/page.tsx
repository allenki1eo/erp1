import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  reportsOverview, salesByMonth, stockValueByWarehouse, topSellingProducts,
} from "@/server/actions/reports";

export default async function ReportsPage() {
  const [overview, monthly, byWh, topProducts] = await Promise.all([
    reportsOverview(),
    salesByMonth(6),
    stockValueByWarehouse(),
    topSellingProducts(10),
  ]);

  const maxBar = Math.max(1, ...monthly.map((m) => m.total));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Executive overview across sales, finance, inventory, production and excise."
      />

      {!overview ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">No active company.</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sales MTD</CardDescription>
                <CardTitle className="text-xl">{formatCurrency(overview.salesMtd)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{overview.orderCount} orders</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Receivables</CardDescription>
                <CardTitle className="text-xl">{formatCurrency(overview.receivables)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <Link href="/finance/receivables" className="underline">Aging report</Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Payables</CardDescription>
                <CardTitle className="text-xl">{formatCurrency(overview.payables)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <Link href="/finance/payables" className="underline">Supplier bills</Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Stock value</CardDescription>
                <CardTitle className="text-xl">{formatCurrency(overview.stockValue)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <Link href="/inventory/stock" className="underline">Stock balance</Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Brews MTD</CardDescription>
                <CardTitle className="text-2xl">{overview.brewsMtd}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Distillations MTD</CardDescription>
                <CardTitle className="text-2xl">{overview.distillationsMtd}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Bottling runs MTD</CardDescription>
                <CardTitle className="text-2xl">{overview.bottlingRunsMtd}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sales last 6 months</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {monthly.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales yet.</p>
                ) : monthly.map((m) => (
                  <div key={m.period} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono">{m.period}</span>
                      <span className="font-medium">{formatCurrency(m.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(m.total / maxBar) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stock value by warehouse</CardTitle>
              </CardHeader>
              <CardContent>
                {byWh.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stock yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Warehouse</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byWh.map((w) => (
                        <TableRow key={w.warehouseId}>
                          <TableCell className="font-medium">{w.warehouseName}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(w.qty, 0)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(w.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top products (last 3 months)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topProducts.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No sales yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p) => (
                      <TableRow key={p.productId}>
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(p.qty, 0)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Excise declared MTD</CardTitle>
              <CardDescription>Statutory excise on duty-paid bonded removals.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.exciseDeclaredMtd)}</div>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/excise/declarations">Declarations</Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
