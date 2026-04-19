import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { listRecipes, deleteRecipe } from "@/server/actions/recipes";
import { listProductsForSelect } from "@/server/actions/procurement";
import { RecipeDialog } from "./recipe-dialog";

export default async function RecipesPage() {
  const [rows, products] = await Promise.all([listRecipes(), listProductsForSelect()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recipes / BOMs"
        description="Beer and spirit bills with ingredients and stages."
        action={<RecipeDialog products={products} />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No recipes yet"
          description="Create your first recipe. After saving, add ingredients and stages."
          action={<RecipeDialog products={products} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Target product</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Yield (L)</TableHead>
                <TableHead className="text-right">ABV</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ recipe, product, itemCount }) => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell className="text-xs">{recipe.version}</TableCell>
                  <TableCell className="text-sm">{product?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{product?.productClass ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{recipe.expectedYield}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {recipe.expectedAbv != null ? `${recipe.expectedAbv}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs">{itemCount}</TableCell>
                  <TableCell>
                    {recipe.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <RecipeDialog
                      recipe={{
                        id: recipe.id,
                        productId: recipe.productId,
                        name: recipe.name,
                        version: recipe.version,
                        expectedYield: recipe.expectedYield,
                        expectedAbv: recipe.expectedAbv,
                        notes: recipe.notes,
                        isActive: recipe.isActive,
                      }}
                      products={products}
                    />
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/masters/recipes/${recipe.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    <DeleteButton
                      id={recipe.id}
                      action={deleteRecipe}
                      confirmMessage={`Delete "${recipe.name}"? Brews & runs may reference it.`}
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
