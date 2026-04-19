import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { listRoutesForSelect } from "@/server/actions/sales";

export default async function RoutesPage() {
  const rows = await listRoutesForSelect();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales Routes"
        description="Van rounds / territories for field sales."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No routes defined"
          description="Routes are configured in master data. Assign a route to orders and customers for territory reporting."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Assigned rep</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.region ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.assignedRepId ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
