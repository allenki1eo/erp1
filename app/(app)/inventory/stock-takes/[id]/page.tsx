import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/crud/submit-button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { getStockTake, confirmStockTake } from "@/server/actions/inventory";
import { StockTakeLineDialog } from "./stock-take-line-dialog";

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "outline"> = {
  DRAFT: "secondary",
  IN_PROGRESS: "warning",
  CONFIRMED: "success",
};

function varianceClass(variance: number | null | undefined): string {
  if (variance == null || variance === 0) return "text-muted-foreground";
  return variance < 0 ? "text-destructive font-medium" : "text-success font-medium";
}

export default async function StockTakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getStockTake(id);
  if (!data) return notFound();

  const { st, lines } = data;
  const confirmAction = confirmStockTake.bind(null, st.id);

  const totalVarianceCost = lines.reduce(
    (s, { line }) => s + (line.varianceCost ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/inventory/stock-takes">
          <ArrowLeft className="size-4" /> Stock takes
        </Link>
      </Button>

      {/* Header card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="font-mono text-lg">{st.number}</CardTitle>
                <Badge variant={STATUS_VARIANTS[st.status] ?? "outline"}>
                  {st.status.replace("_", " ")}
                </Badge>
              </div>
              {st.takenAt && (
                <p className="text-sm text-muted-foreground">
                  Count date: {formatDate(st.takenAt)}
                </p>
              )}
              {totalVarianceCost !== 0 && (
                <p className={`text-sm font-medium ${totalVarianceCost < 0 ? "text-destructive" : "text-success"}`}>
                  Total variance cost: {formatCurrency(totalVarianceCost)}
                </p>
              )}
            </div>
            {st.status !== "CONFIRMED" && (
              <form action={confirmAction}>
                <SubmitButton variant="default">Confirm Stock Take</SubmitButton>
              </form>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Lines table */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Lines ({lines.length})</h2>

        {lines.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No lines found. Lines are auto-populated when the stock take is created.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Lot</TableHead>
                  <TableHead className="hidden md:table-cell">Bin</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead className="text-right">Counted Qty</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Unit Cost</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Var. Cost</TableHead>
                  {st.status !== "CONFIRMED" && (
                    <TableHead className="w-16 text-right">Edit</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(({ line, product, batch, bin }) => {
                  const variance = line.variance ?? 0;
                  const countedQty = line.countedQty;
                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="font-medium">{product?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {product?.sku ?? ""}
                          {product?.uom ? ` · ${product.uom}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                        {batch?.lotNumber ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                        {bin?.code ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(line.systemQty ?? 0, 2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {countedQty != null ? formatNumber(countedQty, 2) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right ${varianceClass(variance)}`}>
                        {countedQty != null
                          ? (variance >= 0 ? "+" : "") + formatNumber(variance, 2)
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
                        {formatCurrency(line.unitCost ?? 0)}
                      </TableCell>
                      <TableCell className={`hidden sm:table-cell text-right ${varianceClass(line.varianceCost)}`}>
                        {countedQty != null
                          ? ((line.varianceCost ?? 0) >= 0 ? "+" : "") +
                            formatCurrency(line.varianceCost ?? 0)
                          : "—"}
                      </TableCell>
                      {st.status !== "CONFIRMED" && (
                        <TableCell className="text-right">
                          <StockTakeLineDialog
                            line={{
                              id: line.id,
                              countedQty: countedQty ?? null,
                              systemQty: line.systemQty ?? 0,
                            }}
                            productName={product?.name ?? "—"}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
