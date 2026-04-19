import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatNumber } from "@/lib/utils";
import { listHeldBatches, listBatchHoldEvents } from "@/server/actions/quality";
import { listStockBatches } from "@/server/actions/inventory";
import { HoldDialog } from "./hold-dialog";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  AVAILABLE: "success",
  ON_HOLD: "warning",
  QUARANTINE: "destructive",
  EXPIRED: "secondary",
  DEPLETED: "secondary",
};

export default async function BatchesHoldPage() {
  const [held, allBatches] = await Promise.all([
    listHeldBatches(),
    listStockBatches(),
  ]);

  const availableBatches = allBatches
    .filter((b) => b.batch.status === "AVAILABLE")
    .map((b) => ({ id: b.batch.id, label: `${b.product?.name ?? "?"} · ${b.batch.lotNumber} · ${formatNumber(b.batch.qtyOnHand, 2)} ${b.batch.uom}` }));

  // Fetch recent events for all held batches in parallel
  const events = await Promise.all(held.map(({ batch }) => listBatchHoldEvents(batch.id)));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Batch Hold / Release"
        description="Place stock batches on hold, quarantine, or release for sale."
        action={<HoldDialog batches={availableBatches} mode="HOLD" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Batches on hold</CardTitle>
          <CardDescription>Stock batches currently unavailable for sale or production.</CardDescription>
        </CardHeader>
        {held.length === 0 ? (
          <div className="p-6"><EmptyState title="No batches on hold" description="All stock batches are currently released." /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last event</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {held.map(({ batch, product }, idx) => {
                const last = events[idx][0];
                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono text-xs">{batch.lotNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{product?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{product?.sku ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(batch.qtyOnHand, 2)} {batch.uom}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[batch.status] ?? "outline"}>
                        {batch.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {last
                        ? <>{last.action} · {formatDate(last.actionedAt)}<div className="truncate max-w-xs">{last.reason ?? ""}</div></>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <HoldDialog
                        batches={[{ id: batch.id, label: `${product?.name ?? ""} · ${batch.lotNumber}` }]}
                        mode="RELEASE"
                        presetBatchId={batch.id}
                      />
                      <HoldDialog
                        batches={[{ id: batch.id, label: `${product?.name ?? ""} · ${batch.lotNumber}` }]}
                        mode="REJECT"
                        presetBatchId={batch.id}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
