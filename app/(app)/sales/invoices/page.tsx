import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listInvoices } from "@/server/actions/sales";
import { PaymentDialog } from "./payment-dialog";

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "destructive" | "outline"> = {
  UNPAID: "secondary",
  PARTIAL: "warning",
  PAID: "success",
  VOID: "destructive",
};

export default async function InvoicesPage() {
  const rows = await listInvoices();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales Invoices"
        description="Customer invoices generated from confirmed orders."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No invoices"
          description="Invoices are generated when a sales order is marked for invoicing."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ invoice: inv, customer }) => {
                const outstanding = inv.total - inv.amountPaid;
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-medium">{inv.number}</TableCell>
                    <TableCell>
                      <div>{customer?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{customer?.code ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell className="text-sm">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANTS[inv.status] ?? "outline"}>{inv.status}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(inv.total)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(inv.amountPaid)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(outstanding)}</TableCell>
                    <TableCell className="text-right">
                      {inv.status !== "PAID" && inv.status !== "VOID" && (
                        <PaymentDialog invoice={{ id: inv.id, number: inv.number, outstanding }} />
                      )}
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
