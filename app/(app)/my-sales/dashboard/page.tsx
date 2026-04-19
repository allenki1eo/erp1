import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/tenant";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { salesStats, topCustomersMtd, topProductsMtd, listVisits } from "@/server/actions/sales";

export default async function MySalesDashboard() {
  const [user, stats, topCustomers, topProducts, recentVisits] = await Promise.all([
    getCurrentUser(),
    salesStats(),
    topCustomersMtd(),
    topProductsMtd(),
    listVisits(true),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="My sales"
        description={`Hello ${user?.name ?? user?.email ?? ""}, here's your month so far.`}
        action={
          <div className="flex gap-2">
            <Button asChild><Link href="/my-sales/new-order">New order</Link></Button>
            <Button asChild variant="outline"><Link href="/my-sales/visits">Log visit</Link></Button>
          </div>
        }
      />

      {!stats ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">No active company.</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sales MTD</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(stats.salesMtd)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{stats.ordersMtd} orders</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Orders MTD</CardDescription>
                <CardTitle className="text-2xl">{stats.ordersMtd}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Visits MTD</CardDescription>
                <CardTitle className="text-2xl">{stats.visitsMtd}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Outstanding AR</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(stats.outstanding)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top customers (MTD)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {topCustomers.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">No orders this month.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.map((c) => (
                        <TableRow key={c.customerId}>
                          <TableCell className="font-medium">{c.customerName}</TableCell>
                          <TableCell className="text-right">{c.orderCount}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(c.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top products (MTD)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {topProducts.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">No sales this month.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((p) => (
                        <TableRow key={p.productId}>
                          <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                          <TableCell className="font-medium">{p.productName}</TableCell>
                          <TableCell className="text-right">{formatNumber(p.qty, 0)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(p.revenue)}</TableCell>
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
              <CardTitle className="text-base">Recent visits</CardTitle>
              <CardDescription>Your last logged customer calls.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentVisits.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No visits logged yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentVisits.slice(0, 8).map((v) => (
                      <TableRow key={v.visit.id}>
                        <TableCell className="text-xs">{new Date(v.visit.visitedAt).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{v.customer?.name ?? "—"}</TableCell>
                        <TableCell className="text-xs">{v.visit.outcome}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v.visit.notes ?? ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
