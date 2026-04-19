import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import { listBarrels, deleteBarrel, listAgingBatches } from "@/server/actions/production";
import { listProductsForSelect, listWarehousesForSelect } from "@/server/actions/procurement";
import { BarrelDialog } from "./barrel-dialog";
import { FillBarrelDialog } from "./fill-dialog";
import { EmptyBarrelDialog } from "./empty-dialog";

const BARREL_VARIANT: Record<string, "secondary" | "success" | "outline" | "warning" | "destructive"> = {
  EMPTY: "secondary",
  FILLED: "success",
  EMPTIED: "outline",
  RETIRED: "destructive",
};

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AgingPage() {
  const [allBarrels, agingRows, products, warehouses] = await Promise.all([
    listBarrels(),
    listAgingBatches(),
    listProductsForSelect(),
    listWarehousesForSelect(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aging / Barrels"
        description="Barrel register and maturation lots. Angel's share is computed on empty."
        action={
          <div className="flex gap-2">
            <BarrelDialog warehouses={warehouses} />
            <FillBarrelDialog barrels={allBarrels} products={products} />
          </div>
        }
      />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Barrels</h2>
        {allBarrels.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No barrels registered yet.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Wood</TableHead>
                  <TableHead>Char</TableHead>
                  <TableHead>Fills</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allBarrels.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs font-medium">{b.code}</TableCell>
                    <TableCell className="text-xs">{b.capacity}L</TableCell>
                    <TableCell className="text-xs">{b.woodType?.replace("_", " ") ?? "—"}</TableCell>
                    <TableCell className="text-xs">{b.charLevel ?? "—"}</TableCell>
                    <TableCell className="text-xs">{b.fillsCount}</TableCell>
                    <TableCell>
                      <Badge variant={BARREL_VARIANT[b.status] ?? "secondary"}>{b.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <BarrelDialog
                        barrel={{
                          id: b.id,
                          code: b.code,
                          capacity: b.capacity,
                          woodType: b.woodType,
                          charLevel: b.charLevel,
                          warehouseId: b.warehouseId,
                          status: b.status,
                        }}
                        warehouses={warehouses}
                      />
                      <DeleteButton
                        id={b.id}
                        action={deleteBarrel}
                        confirmMessage={`Delete barrel "${b.code}"? Aging history will also be deleted.`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Aging batches</h2>
        {agingRows.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No aging batches yet. Fill a barrel to start tracking maturation.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barrel</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Fill (L)</TableHead>
                  <TableHead className="text-right">Fill ABV</TableHead>
                  <TableHead>Filled</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Emptied</TableHead>
                  <TableHead className="text-right">Angel&apos;s share</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agingRows.map(({ batch, barrel, product }) => {
                  const age = batch.emptiedAt
                    ? daysBetween(batch.filledAt, batch.emptiedAt)
                    : daysBetween(batch.filledAt, new Date());
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-xs">{barrel?.code ?? "—"}</TableCell>
                      <TableCell className="text-sm">{product?.name ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{batch.fillVolume}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{batch.fillAbv}%</TableCell>
                      <TableCell className="text-xs">{formatDate(batch.filledAt)}</TableCell>
                      <TableCell className="text-xs">{age} days</TableCell>
                      <TableCell className="text-xs">
                        {batch.emptiedAt ? formatDate(batch.emptiedAt) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {batch.angelsShare != null ? `${batch.angelsShare.toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {!batch.emptiedAt && barrel && (
                          <EmptyBarrelDialog
                            agingBatchId={batch.id}
                            barrelCode={barrel.code}
                            fillVolume={batch.fillVolume}
                            fillAbv={batch.fillAbv}
                          />
                        )}
                      </TableCell>
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
