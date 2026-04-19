import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import { listNonConformances, deleteNonConformance } from "@/server/actions/quality";
import { NcDialog } from "./nc-dialog";

const SEV: Record<string, "secondary" | "warning" | "destructive"> = {
  MINOR: "secondary",
  MAJOR: "warning",
  CRITICAL: "destructive",
};

const STATUS: Record<string, "warning" | "secondary" | "success"> = {
  OPEN: "warning",
  IN_REVIEW: "secondary",
  CLOSED: "success",
};

export default async function NonConformancePage() {
  const rows = await listNonConformances();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Non-Conformances"
        description="Issues, root cause analysis, corrective actions, and batch disposition."
        action={<NcDialog />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No non-conformances"
          description="Raise an NCR when a check fails or a process deviates from spec."
          action={<NcDialog />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Raised</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Disposition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono text-xs font-medium">{n.number}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(n.raisedAt)}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {n.refType ? `${n.refType} · ${n.refId?.slice(0, 8) ?? ""}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={SEV[n.severity] ?? "outline"}>{n.severity}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm" title={n.description}>
                    {n.description}
                  </TableCell>
                  <TableCell className="text-xs">{n.disposition ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS[n.status] ?? "outline"}>{n.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <NcDialog nc={n} />
                    <DeleteButton id={n.id} action={deleteNonConformance} />
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
