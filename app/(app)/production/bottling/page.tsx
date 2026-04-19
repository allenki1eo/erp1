import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import { listBottlingRuns, deleteBottling } from "@/server/actions/production";
import { listProductsForSelect } from "@/server/actions/procurement";
import { BottlingDialog } from "./bottling-dialog";

const STATUS_VARIANT: Record<string, "secondary" | "success" | "outline" | "warning" | "destructive"> = {
  PLANNED: "secondary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export default async function BottlingPage() {
  const [rows, products] = await Promise.all([
    listBottlingRuns(),
    listProductsForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bottling / Packaging"
        description="Convert bulk liquid into finished SKUs (cases, bottles)."
        action={<BottlingDialog products={products} />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No bottling runs yet"
          description="Plan a run from a brew or aging batch."
          action={<BottlingDialog products={products} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run #</TableHead>
                <TableHead>Finished product</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead className="hidden md:table-cell">Start</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ run, product }) => (
                <TableRow key={run.id}>
                  <TableCell className="font-mono text-xs font-medium">{run.runNumber}</TableCell>
                  <TableCell className="text-sm">{product?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {run.sourceType ? `${run.sourceType}${run.sourceBatchId ? ` · ${run.sourceBatchId.slice(0, 8)}` : ""}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[run.status] ?? "secondary"}>{run.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">{run.plannedQty}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{run.actualQty ?? "—"}</TableCell>
                  <TableCell className="text-xs">{run.uom}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{formatDate(run.startDate)}</TableCell>
                  <TableCell className="text-right">
                    <BottlingDialog
                      run={{
                        id: run.id,
                        runNumber: run.runNumber,
                        finishedProductId: run.finishedProductId,
                        sourceBatchId: run.sourceBatchId,
                        sourceType: run.sourceType,
                        plannedQty: run.plannedQty,
                        actualQty: run.actualQty,
                        uom: run.uom,
                        startDate: run.startDate,
                        endDate: run.endDate,
                        status: run.status,
                        notes: run.notes,
                      }}
                      products={products}
                    />
                    <DeleteButton
                      id={run.id}
                      action={deleteBottling}
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
