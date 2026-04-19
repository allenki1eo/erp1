import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import {
  listBondedMovements, deleteBondedMovement,
  listBondedWarehouses, listExciseableProducts,
} from "@/server/actions/excise";
import { listWarehousesForSelect } from "@/server/actions/procurement";
import { BondedDialog } from "./bonded-dialog";

const TYPE_VARIANTS: Record<string, "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  ENTRY: "secondary",
  REMOVAL_DUTY_PAID: "success",
  REMOVAL_EXPORT: "outline",
  TRANSFER_BONDED: "outline",
  LOSS: "warning",
  DESTRUCTION: "destructive",
};

export default async function BondedPage() {
  const [movements, bondedWarehouses, allWarehouses, products] = await Promise.all([
    listBondedMovements(),
    listBondedWarehouses(),
    listWarehousesForSelect(),
    listExciseableProducts(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bonded Warehouse"
        description="Duty-suspended stock movements. Excise is recognised only on duty-paid removals."
        action={<BondedDialog bondedWarehouses={bondedWarehouses} allWarehouses={allWarehouses} products={products} />}
      />

      {bondedWarehouses.length === 0 && (
        <Card className="p-4 text-sm text-amber-700 bg-amber-50 border-amber-200">
          No bonded warehouses configured. Go to <a className="underline" href="/masters/warehouses">Master Data → Warehouses</a> and set type to <b>BONDED</b>.
        </Card>
      )}

      {movements.length === 0 ? (
        <EmptyState
          title="No bonded movements"
          description="Record entries into and removals from your bonded warehouse to track duty liability."
          action={<BondedDialog bondedWarehouses={bondedWarehouses} allWarehouses={allWarehouses} products={products} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Litres</TableHead>
                <TableHead className="text-right">ABV</TableHead>
                <TableHead className="text-right">LoA</TableHead>
                <TableHead className="text-right">Excise</TableHead>
                <TableHead>Declaration</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map(({ movement: m, product, warehouse }) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs font-medium">{m.number}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(m.movedAt)}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANTS[m.movementType] ?? "outline"}>
                      {m.movementType.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{product?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{product?.sku ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-xs">{warehouse?.name ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(m.qtyLitres, 2)}</TableCell>
                  <TableCell className="text-right text-xs">
                    {m.abv != null ? `${formatNumber(m.abv * 100, 1)}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {m.loa != null ? formatNumber(m.loa, 2) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {m.exciseAmount > 0 ? formatCurrency(m.exciseAmount) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {m.declarationId ? <Badge variant="success">Declared</Badge> : <Badge variant="secondary">Pending</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {!m.declarationId && <DeleteButton id={m.id} action={deleteBondedMovement} />}
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
