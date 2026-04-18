import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  listSupplierInvoices, deleteSupplierInvoice,
  listSuppliersForSelect, listPOs, listGRNs,
} from "@/server/actions/procurement";
import { SupplierInvoiceDialog } from "./supplier-invoice-dialog";

function statusVariant(s: string) {
  switch (s) {
    case "APPROVED": case "PAID": return "success" as const;
    case "PARTIAL": return "warning" as const;
    case "DISPUTED": return "destructive" as const;
    default: return "secondary" as const;
  }
}

export default async function SupplierInvoicesPage() {
  const [rows, suppliers, posRaw, grnsRaw] = await Promise.all([
    listSupplierInvoices(),
    listSuppliersForSelect(),
    listPOs(),
    listGRNs(),
  ]);
  const pos = posRaw.map(({ po }) => ({ id: po.id, number: po.number }));
  const grns = grnsRaw.map(({ grn }) => ({ id: grn.id, number: grn.number }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Supplier invoices"
        description="Track invoices received from suppliers and payment status."
        action={<SupplierInvoiceDialog suppliers={suppliers} pos={pos} grns={grns} />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No supplier invoices"
          description="Record an invoice once received from a supplier."
          action={<SupplierInvoiceDialog suppliers={suppliers} pos={pos} grns={grns} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Our ref</TableHead>
                <TableHead className="hidden md:table-cell">Supplier inv. no.</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ inv, supplier }) => {
                const outstanding = inv.total - inv.paidAmount;
                const overdue = inv.dueDate && new Date(inv.dueDate) < new Date() && outstanding > 0;
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-medium">{inv.ourRef}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{inv.supplierInvoiceNumber ?? "—"}</TableCell>
                    <TableCell className="text-sm">{supplier?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant(inv.status)}>{inv.status}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      <span className={overdue ? "text-destructive font-medium" : ""}>
                        {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.total)}</TableCell>
                    <TableCell className="text-right">
                      <span className={outstanding > 0 ? "font-medium text-amber-600" : "text-muted-foreground"}>
                        {formatCurrency(outstanding)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <SupplierInvoiceDialog
                        invoice={{ id: inv.id, supplierId: inv.supplierId, poId: inv.poId ?? null, grnId: inv.grnId ?? null, supplierInvoiceNumber: inv.supplierInvoiceNumber ?? null, invoiceDate: inv.invoiceDate, dueDate: inv.dueDate ?? null, notes: inv.notes ?? null }}
                        suppliers={suppliers}
                        pos={pos}
                        grns={grns}
                      />
                      <DeleteButton id={inv.id} action={deleteSupplierInvoice} />
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
