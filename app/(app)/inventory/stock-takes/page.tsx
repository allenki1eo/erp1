import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate, formatNumber } from "@/lib/utils";
import { listStockTakes, deleteStockTake } from "@/server/actions/inventory";
import { listWarehousesForSelect } from "@/server/actions/procurement";
import { StockTakeDialog } from "./stock-take-dialog";

const STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "outline"> = {
  DRAFT: "secondary",
  IN_PROGRESS: "warning",
  CONFIRMED: "success",
};

export default async function StockTakesPage() {
  const [rows, warehouses] = await Promise.all([
    listStockTakes(),
    listWarehousesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Takes"
        description="Creates stock takes with auto-populated lines from current batch balances."
        action={<StockTakeDialog warehouses={warehouses} />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No stock takes yet"
          description="Create a stock take to count and reconcile warehouse inventory."
          action={<StockTakeDialog warehouses={warehouses} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ stockTake: st, warehouse, lineCount }) => (
                <TableRow key={st.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {st.number}
                  </TableCell>
                  <TableCell className="text-sm">
                    {warehouse?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[st.status] ?? "outline"}>
                      {st.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {st.takenAt ? formatDate(st.takenAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(lineCount, 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/inventory/stock-takes/${st.id}`}>View</Link>
                    </Button>
                    <DeleteButton id={st.id} action={deleteStockTake} />
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
