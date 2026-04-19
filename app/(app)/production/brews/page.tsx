import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import { listBrews, deleteBrew, listRecipesForSelect } from "@/server/actions/production";
import { listProductsForSelect } from "@/server/actions/procurement";
import { BrewDialog } from "./brew-dialog";

const STATUS_VARIANT: Record<string, "secondary" | "success" | "outline" | "warning" | "destructive"> = {
  PLANNED: "secondary",
  MASHING: "warning",
  BOILING: "warning",
  FERMENTING: "outline",
  CONDITIONING: "outline",
  PACKAGED: "success",
  CANCELLED: "destructive",
};

export default async function BrewsPage() {
  const [rows, products, recipes] = await Promise.all([
    listBrews(),
    listProductsForSelect(),
    listRecipesForSelect(),
  ]);

  const beerProducts = products;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Brews (Beer)"
        description="Batch sheets tracking brew progress through mashing, boiling, fermentation and conditioning."
        action={<BrewDialog products={beerProducts} recipes={recipes} />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No brews yet"
          description="Plan your first brew from a recipe."
          action={<BrewDialog products={beerProducts} recipes={recipes} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Recipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="hidden md:table-cell">ABV</TableHead>
                <TableHead className="hidden md:table-cell">Start</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ brew, product, recipe }) => (
                <TableRow key={brew.id}>
                  <TableCell className="font-mono text-xs font-medium">{brew.batchNumber}</TableCell>
                  <TableCell className="text-sm">{product?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {recipe ? `${recipe.name} v${recipe.version}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[brew.status] ?? "secondary"}>{brew.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{brew.plannedVolume}L</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {brew.actualVolume != null ? `${brew.actualVolume}L` : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">
                    {brew.finalAbv != null ? `${brew.finalAbv}%` : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{formatDate(brew.startDate)}</TableCell>
                  <TableCell className="text-right">
                    <BrewDialog
                      brew={{
                        id: brew.id,
                        batchNumber: brew.batchNumber,
                        productId: brew.productId,
                        recipeId: brew.recipeId,
                        vesselId: brew.vesselId,
                        plannedVolume: brew.plannedVolume,
                        actualVolume: brew.actualVolume,
                        startDate: brew.startDate,
                        endDate: brew.endDate,
                        status: brew.status,
                        finalAbv: brew.finalAbv,
                        yieldPercent: brew.yieldPercent,
                        notes: brew.notes,
                      }}
                      products={beerProducts}
                      recipes={recipes}
                    />
                    <DeleteButton
                      id={brew.id}
                      action={deleteBrew}
                      confirmMessage={`Delete brew "${brew.batchNumber}"?`}
                    />
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
