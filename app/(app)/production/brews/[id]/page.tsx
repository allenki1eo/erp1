import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import {
  getBrew,
  getBomForBrew,
  listBrewMaterialUsage,
  deleteBrewMaterialUsage,
} from "@/server/actions/production";
import { listProductsForSelect } from "@/server/actions/procurement";
import { MaterialUsageDialog } from "./material-usage-dialog";

const STATUS_VARIANT: Record<string, "secondary" | "success" | "outline" | "warning" | "destructive"> = {
  PLANNED: "secondary",
  MASHING: "warning",
  BOILING: "warning",
  FERMENTING: "outline",
  CONDITIONING: "outline",
  PACKAGED: "success",
  CANCELLED: "destructive",
};

export default async function BrewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [data, bomRows, usageRows, products] = await Promise.all([
    getBrew(id),
    getBomForBrew(id),
    listBrewMaterialUsage(id),
    listProductsForSelect(),
  ]);

  if (!data) notFound();
  const { brew, product, recipe } = data;

  // Scale factor: actual planned volume / recipe expected yield (if both known)
  const scaleFactor =
    recipe && recipe.expectedYield && recipe.expectedYield > 0
      ? brew.plannedVolume / recipe.expectedYield
      : 1;

  // Group BOM by stage
  const bomByStage = bomRows.reduce<Record<string, typeof bomRows>>((acc, row) => {
    const stage = row.item.stage ?? "—";
    (acc[stage] ||= []).push(row);
    return acc;
  }, {});

  // Build a map of productId → total actual usage for comparison
  const usageMap: Record<string, number> = {};
  for (const { usage } of usageRows) {
    usageMap[usage.productId] = (usageMap[usage.productId] ?? 0) + usage.qty;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Brew: ${brew.batchNumber}`}
        description={product ? `${product.name} · ${recipe ? `${recipe.name} v${recipe.version}` : "No recipe"}` : ""}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/production/brews">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        }
      />

      {/* Brew stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={STATUS_VARIANT[brew.status] ?? "secondary"}>{brew.status}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Planned Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brew.plannedVolume} L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actual Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brew.actualVolume != null ? `${brew.actualVolume} L` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatDate(brew.startDate)}</div>
          </CardContent>
        </Card>
      </div>

      {/* BOM Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Bill of Materials
            {recipe && scaleFactor !== 1 && (
              <span className="ml-2 text-xs normal-case font-normal">
                (scaled ×{scaleFactor.toFixed(2)} for {brew.plannedVolume}L batch)
              </span>
            )}
          </h2>
          {recipe && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/masters/recipes/${recipe.id}`}>View Recipe</Link>
            </Button>
          )}
        </div>

        {bomRows.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {brew.recipeId
              ? "No ingredients found on the linked recipe."
              : "No recipe linked to this brew. Edit the brew to select a recipe."}
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Planned Qty</TableHead>
                  <TableHead>UoM</TableHead>
                  <TableHead className="text-right">Actual Used</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(bomByStage).map(([stage, rows]) =>
                  rows.map(({ item, product: ip }, idx) => {
                    const planned = item.quantity * scaleFactor;
                    const actual = usageMap[item.productId] ?? null;
                    const variance = actual != null ? actual - planned : null;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {idx === 0 ? <Badge variant="outline">{stage}</Badge> : ""}
                        </TableCell>
                        <TableCell className="text-sm">{ip?.name ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {planned.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-xs">{item.uom}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {actual != null ? actual.toFixed(3) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {variance != null ? (
                            <span className={variance > 0 ? "text-destructive" : variance < 0 ? "text-emerald-600" : ""}>
                              {variance > 0 ? "+" : ""}{variance.toFixed(3)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Actual Material Usage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Actual Material Usage
          </h2>
          <MaterialUsageDialog brewId={brew.id} products={products} />
        </div>

        {usageRows.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No material usage logged yet.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Qty Used</TableHead>
                  <TableHead>UoM</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRows.map(({ usage, product: up }) => (
                  <TableRow key={usage.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {usage.stage ? <Badge variant="outline">{usage.stage}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{up?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{usage.qty}</TableCell>
                    <TableCell className="text-xs">{usage.uom}</TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        id={usage.id}
                        action={deleteBrewMaterialUsage}
                        confirmMessage="Remove this usage record?"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Notes */}
      {brew.notes && (
        <Card className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{brew.notes}</p>
        </Card>
      )}
    </div>
  );
}
