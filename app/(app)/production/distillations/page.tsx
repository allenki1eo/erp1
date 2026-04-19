import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import { listDistillations, deleteDistillation, listRecipesForSelect } from "@/server/actions/production";
import { listProductsForSelect } from "@/server/actions/procurement";
import { DistDialog } from "./dist-dialog";

const STATUS_VARIANT: Record<string, "secondary" | "success" | "outline" | "warning" | "destructive"> = {
  PLANNED: "secondary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export default async function DistillationsPage() {
  const [rows, products, recipes] = await Promise.all([
    listDistillations(),
    listProductsForSelect(),
    listRecipesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Distillations"
        description="Still run sheets with cuts tracking (heads/hearts/tails) and litres of alcohol."
        action={<DistDialog products={products} recipes={recipes} />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No distillation runs yet"
          description="Plan your first still run."
          action={<DistDialog products={products} recipes={recipes} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Still</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Feed (L)</TableHead>
                <TableHead className="text-right">Feed ABV</TableHead>
                <TableHead className="text-right">Output (L)</TableHead>
                <TableHead className="hidden md:table-cell">Start</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ run, product }) => (
                <TableRow key={run.id}>
                  <TableCell className="font-mono text-xs font-medium">{run.runNumber}</TableCell>
                  <TableCell className="text-sm">{product?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{run.stillId ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[run.status] ?? "secondary"}>{run.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{run.feedVolume ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {run.feedAbv != null ? `${run.feedAbv}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{run.totalOutput ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{formatDate(run.startDate)}</TableCell>
                  <TableCell className="text-right">
                    <DistDialog
                      run={{
                        id: run.id,
                        runNumber: run.runNumber,
                        productId: run.productId,
                        recipeId: run.recipeId,
                        stillId: run.stillId,
                        startDate: run.startDate,
                        endDate: run.endDate,
                        status: run.status,
                        feedVolume: run.feedVolume,
                        feedAbv: run.feedAbv,
                        totalOutput: run.totalOutput,
                        notes: run.notes,
                      }}
                      products={products}
                      recipes={recipes}
                    />
                    <DeleteButton
                      id={run.id}
                      action={deleteDistillation}
                      confirmMessage={`Delete run "${run.runNumber}"?`}
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
