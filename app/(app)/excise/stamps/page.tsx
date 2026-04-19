import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate, formatNumber } from "@/lib/utils";
import { listStampRolls, listAllocations, deleteStampRoll } from "@/server/actions/excise";
import { listWarehousesForSelect } from "@/server/actions/procurement";
import { RollDialog } from "./roll-dialog";
import { AllocateDialog } from "./allocate-dialog";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  RECEIVED: "secondary",
  IN_USE: "warning",
  EXHAUSTED: "success",
  VOID: "destructive",
};

export default async function StampsPage() {
  const [rolls, allocations, warehouses] = await Promise.all([
    listStampRolls(),
    listAllocations(),
    listWarehousesForSelect(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Stamps"
        description="TRA-issued stamp rolls and allocations. Each finished bottle must carry a valid serial."
        action={<RollDialog warehouses={warehouses} />}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Stamp rolls</CardTitle>
            <CardDescription>Serial ranges issued by the Tanzania Revenue Authority.</CardDescription>
          </div>
          <AllocateDialog rolls={rolls.map(({ roll }) => roll)} />
        </CardHeader>
        {rolls.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No stamp rolls"
              description="Record a roll when received from TRA."
              action={<RollDialog warehouses={warehouses} />}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-xs">Serials</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Wasted</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rolls.map(({ roll, warehouse }) => {
                const remaining = roll.quantity - roll.usedQty - roll.wastedQty;
                return (
                  <TableRow key={roll.id}>
                    <TableCell className="font-mono text-xs font-medium">{roll.rollNumber}</TableCell>
                    <TableCell><Badge variant="outline">{roll.stampType}</Badge></TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {roll.serialFrom} → {roll.serialTo}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(roll.quantity, 0)}</TableCell>
                    <TableCell className="text-right">{formatNumber(roll.usedQty, 0)}</TableCell>
                    <TableCell className="text-right">{formatNumber(roll.wastedQty, 0)}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(remaining, 0)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[roll.status] ?? "outline"}>{roll.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{warehouse?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <RollDialog roll={roll} warehouses={warehouses} />
                      <DeleteButton id={roll.id} action={deleteStampRoll} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent allocations</CardTitle>
          <CardDescription>Serial ranges assigned to bottling runs and finished goods.</CardDescription>
        </CardHeader>
        {allocations.length === 0 ? (
          <div className="p-6"><EmptyState title="No allocations yet" description="Stamps will appear here once assigned." /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead className="text-xs">Serials</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Wasted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map(({ allocation: a, roll }) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">{formatDate(a.allocatedAt)}</TableCell>
                  <TableCell className="text-xs font-mono">{roll?.rollNumber ?? "—"}</TableCell>
                  <TableCell className="text-xs">{a.refType} · {a.refId?.slice(0, 8) ?? "—"}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {a.serialFrom} → {a.serialTo}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(a.quantity, 0)}</TableCell>
                  <TableCell className="text-right">{formatNumber(a.wastedQty, 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
