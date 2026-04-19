import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency } from "@/lib/utils";
import { customerBalances } from "@/server/actions/finance";

export default async function SalesCustomersPage() {
  const rows = await customerBalances();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customer Balances"
        description="Customers with outstanding invoices, highest first."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/masters/customers">Manage customers</Link>
          </Button>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No outstanding balances"
          description="All customers are paid in full."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Open invoices</TableHead>
                <TableHead className="text-right">Credit limit</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Exposure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const limit = r.creditLimit ?? 0;
                const pct = limit > 0 ? (r.outstanding / limit) * 100 : 0;
                return (
                  <TableRow key={r.customerId}>
                    <TableCell className="font-mono text-xs">{r.customerCode}</TableCell>
                    <TableCell className="font-medium">{r.customerName}</TableCell>
                    <TableCell className="text-right">{r.openInvoices}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {limit > 0 ? formatCurrency(limit) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(r.outstanding)}</TableCell>
                    <TableCell className={`text-right text-xs font-medium ${pct > 90 ? "text-destructive" : pct > 70 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {limit > 0 ? `${pct.toFixed(0)}%` : "—"}
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
