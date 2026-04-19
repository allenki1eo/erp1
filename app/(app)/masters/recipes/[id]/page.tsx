import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/crud/delete-button";
import { getRecipe, deleteRecipeItem } from "@/server/actions/recipes";
import { listProductsForSelect } from "@/server/actions/procurement";
import { RecipeItemDialog } from "./item-dialog";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, products] = await Promise.all([getRecipe(id), listProductsForSelect()]);
  if (!data) notFound();

  const { recipe, product, items } = data;

  const byStage = items.reduce<Record<string, typeof items>>((acc, row) => {
    const stage = row.item.stage ?? "—";
    (acc[stage] ||= []).push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${recipe.name} v${recipe.version}`}
        description={product ? `Target: ${product.name} (${product.productClass ?? "—"})` : ""}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/masters/recipes">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Expected yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipe.expectedYield} L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Expected ABV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recipe.expectedAbv != null ? `${recipe.expectedAbv}%` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recipe.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</h2>
          <RecipeItemDialog recipeId={recipe.id} products={products} />
        </div>

        {items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No ingredients yet. Add a grain, hop, yeast, or packaging item.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>UoM</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(byStage).map(([stage, rows]) =>
                  rows.map(({ item, product: ip }, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {idx === 0 ? <Badge variant="outline">{stage}</Badge> : ""}
                      </TableCell>
                      <TableCell className="text-sm">{ip?.name ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{item.quantity}</TableCell>
                      <TableCell className="text-xs">{item.uom}</TableCell>
                      <TableCell className="text-right">
                        <RecipeItemDialog
                          recipeId={recipe.id}
                          item={{
                            id: item.id,
                            productId: item.productId,
                            quantity: item.quantity,
                            uom: item.uom,
                            stage: item.stage,
                          }}
                          products={products}
                        />
                        <DeleteButton id={item.id} action={deleteRecipeItem} confirmMessage="Remove this ingredient?" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {recipe.notes && (
          <Card className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{recipe.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
