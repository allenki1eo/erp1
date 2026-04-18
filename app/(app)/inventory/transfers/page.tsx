import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate, formatNumber } from "@/lib/utils";
import { listTransfers, deleteTransfer } from "@/server/actions/inventory";
import { listWarehousesForSelect } from "@/server/actions/procurement";
import { TransferDialog } from "./transfer-dialog";

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  IN_TRANSIT: "warning",
  RECEIVED: "success",
  CANCELLED: "destructive",
};

export default async function TransfersPage() {
  const [rows, warehouses] = await Promise.all([
    listTransfers(),
    listWarehousesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Transfers"
        description="Inter-warehouse movements."
        action={<TransferDialog warehouses={warehouses} />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No transfers yet"
          description="Create a transfer to move stock between warehouses."
          action={<TransferDialog warehouses={warehouses} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>From Warehouse</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="hidden md:table-cell">Transferred</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ transfer: t, fromWarehouse, lineCount }) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {t.number}
                  </TableCell>
                  <TableCell className="text-sm">
                    {fromWarehouse?.name ?? "—"}
                    {fromWarehouse?.code ? (
                      <span className="ml-1 text-xs text-muted-foreground font-mono">
                        ({fromWarehouse.code})
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(lineCount, 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[t.status] ?? "outline"}>
                      {t.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {t.createdAt ? formatDate(t.createdAt) : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {t.transferredAt ? formatDate(t.transferredAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/inventory/transfers/${t.id}`}>View</Link>
                    </Button>
                    {t.status === "DRAFT" && (
                      <DeleteButton id={t.id} action={deleteTransfer} />
                    )}
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
