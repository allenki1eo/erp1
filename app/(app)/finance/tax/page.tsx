import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { taxSummary } from "@/server/actions/finance";

export default async function TaxPage() {
  const s = await taxSummary();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tax (TRA)"
        description={s ? `Period ${formatDate(s.periodStart)} – ${formatDate(s.periodEnd)} (current month).` : "Tanzania VAT + excise summary."}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/excise">Excise module</Link>
          </Button>
        }
      />

      {!s ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">No active company.</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Output VAT (sales)</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(s.outputVat)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {s.outputInvoiceCount} invoices · net {formatCurrency(s.outputNet)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Input VAT (purchases)</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(s.inputVat)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {s.inputInvoiceCount} bills · net {formatCurrency(s.inputNet)}
              </CardContent>
            </Card>
            <Card className={s.netVatPayable >= 0 ? "border-amber-200" : "border-green-200"}>
              <CardHeader className="pb-2">
                <CardDescription>Net VAT {s.netVatPayable >= 0 ? "payable" : "credit"}</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(Math.abs(s.netVatPayable))}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Output − Input
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Excise</CardTitle>
                <CardDescription>Declared in TRA declarations this period.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(s.exciseDeclared)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.exciseDeclarationCount} declaration(s) · excise collected on sales invoices: {formatCurrency(s.outputExcise)}
                </div>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/excise/declarations">View declarations</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filing checklist</CardTitle>
                <CardDescription>Monthly Tanzania Revenue Authority filings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>VAT return (due 20th)</span>
                  <span className="text-muted-foreground text-xs">Manual</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Excise declaration</span>
                  <Link href="/excise/declarations" className="text-primary underline text-xs">Open</Link>
                </div>
                <div className="flex items-center justify-between">
                  <span>WHT certificates</span>
                  <span className="text-muted-foreground text-xs">Manual</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
