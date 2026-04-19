import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { listVisits, listCustomersForSelect } from "@/server/actions/sales";
import { VisitDialog } from "./visit-dialog";

const OUTCOME_COLORS: Record<string, string> = {
  ORDER: "text-green-600",
  NO_ORDER: "text-muted-foreground",
  FOLLOW_UP: "text-amber-600",
  COMPLAINT: "text-red-600",
};

export default async function VisitsPage() {
  const [visits, customers] = await Promise.all([
    listVisits(true),
    listCustomersForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customer visits"
        description="Field call log with outcome and optional GPS."
        action={<VisitDialog customers={customers.map((c) => ({ id: c.id, code: c.code, name: c.name }))} />}
      />

      {visits.length === 0 ? (
        <EmptyState title="No visits yet" description="Log your first customer call." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((v) => (
                <TableRow key={v.visit.id}>
                  <TableCell className="text-xs">{new Date(v.visit.visitedAt).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{v.customer?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={OUTCOME_COLORS[v.visit.outcome]}>
                      {v.visit.outcome.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {v.visit.latitude != null && v.visit.longitude != null
                      ? `${v.visit.latitude.toFixed(4)}, ${v.visit.longitude.toFixed(4)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{v.visit.notes ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
