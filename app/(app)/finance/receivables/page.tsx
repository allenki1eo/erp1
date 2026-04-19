import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listReceivables } from "@/server/actions/finance";
import { PaymentDialog } from "../../sales/invoices/payment-dialog";

const BUCKET_LABELS = {
  CURRENT: "Current",
  D1_30: "1–30",
  D31_60: "31–60",
  D61_90: "61–90",
  D90PLUS: "90+",
};
const BUCKET_COLORS: Record<string, string> = {
  CURRENT: "text-muted-foreground",
  D1_30: "text-amber-600",
  D31_60: "text-orange-600",
  D61_90: "text-red-600",
  D90PLUS: "text-destructive font-semibold",
};

export default async function ReceivablesPage() {
  const { rows, totals } = await listReceivables();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Receivables"
        description="Unpaid and partially paid customer invoices, aged."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {(["CURRENT", "D1_30", "D31_60", "D61_90", "D90PLUS"] as const).map((b) => (
          <Card key={b}>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground">{BUCKET_LABELS[b]} days</div>
              <div className={`text-lg font-bold ${BUCKET_COLORS[b]}`}>{formatCurrency(totals[b] ?? 0)}</div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total AR</div>
            <div className="text-lg font-bold">{formatCurrency(totals.TOTAL ?? 0)}</div>
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="All clear" description="No outstanding receivables." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice date</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Bucket</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.invoice.id}>
                  <TableCell className="font-mono text-xs font-medium">{r.invoice.number}</TableCell>
                  <TableCell>
                    <div>{r.customer?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.customer?.phone ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(r.invoice.invoiceDate)}</TableCell>
                  <TableCell className="text-sm">{r.invoice.dueDate ? formatDate(r.invoice.dueDate) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={BUCKET_COLORS[r.bucket]}>
                      {BUCKET_LABELS[r.bucket]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(r.outstanding)}</TableCell>
                  <TableCell className="text-right">
                    <PaymentDialog invoice={{ id: r.invoice.id, number: r.invoice.number, outstanding: r.outstanding }} />
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
