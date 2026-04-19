import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { listDeclarations, deleteDeclaration } from "@/server/actions/excise";
import { DeclarationDialog } from "./declaration-dialog";

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  DRAFT: "secondary",
  SUBMITTED: "warning",
  PAID: "success",
  ACCEPTED: "success",
  REJECTED: "destructive",
};

export default async function DeclarationsPage() {
  const rows = await listDeclarations();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Statutory Excise Declarations"
        description="Monthly TRA returns aggregated from duty-paid bonded removals."
        action={<DeclarationDialog />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No declarations"
          description="Create a declaration for the reporting period. It auto-aggregates duty-paid removals."
          action={<DeclarationDialog />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Litres</TableHead>
                <TableHead className="text-right">LoA</TableHead>
                <TableHead className="text-right">Excise</TableHead>
                <TableHead>TRA reference</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs font-medium">{d.number}</TableCell>
                  <TableCell className="text-sm">
                    <div>{d.periodLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(d.periodStart)} – {formatDate(d.periodEnd)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[d.status] ?? "outline"}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(d.totalLitres, 1)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(d.totalLoa, 2)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(d.totalExcise)}</TableCell>
                  <TableCell className="text-xs font-mono">{d.traReference ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/excise/declarations/${d.id}`}>View</Link>
                    </Button>
                    {d.status === "DRAFT" && <DeleteButton id={d.id} action={deleteDeclaration} />}
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
