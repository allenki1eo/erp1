import { notFound } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getDeclaration } from "@/server/actions/excise";
import { SubmitActions } from "./submit-actions";

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  DRAFT: "secondary",
  SUBMITTED: "warning",
  PAID: "success",
  ACCEPTED: "success",
  REJECTED: "destructive",
};

export default async function DeclarationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDeclaration(id);
  if (!data) notFound();
  const { decl, lines } = data;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Declaration ${decl.number}`}
        description={`Period ${decl.periodLabel} (${formatDate(decl.periodStart)} – ${formatDate(decl.periodEnd)})`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link href="/excise/declarations">Back</Link></Button>
            <SubmitActions declaration={decl} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground">Status</div>
          <Badge variant={STATUS_VARIANTS[decl.status] ?? "outline"}>{decl.status}</Badge>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground">Total litres</div>
          <div className="text-2xl font-bold">{formatNumber(decl.totalLitres, 1)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground">Total LoA</div>
          <div className="text-2xl font-bold">{formatNumber(decl.totalLoa, 2)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground">Excise payable</div>
          <div className="text-2xl font-bold">{formatCurrency(decl.totalExcise)}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown by product class</CardTitle>
          <CardDescription>
            {lines.length} lines aggregated from duty-paid bonded removals in the period.
          </CardDescription>
        </CardHeader>
        {lines.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No duty-paid removals found for this period.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product class</TableHead>
                <TableHead className="text-right">Movements</TableHead>
                <TableHead className="text-right">Litres</TableHead>
                <TableHead className="text-right">LoA</TableHead>
                <TableHead className="text-right">Excise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.productClass}</TableCell>
                  <TableCell className="text-right">{formatNumber(l.movementCount, 0)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(l.qtyLitres, 2)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(l.qtyLoa, 2)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(l.exciseAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {decl.notes && (
        <Card className="p-4 text-sm">
          <div className="text-xs font-medium text-muted-foreground mb-1">Notes</div>
          {decl.notes}
        </Card>
      )}
    </div>
  );
}
