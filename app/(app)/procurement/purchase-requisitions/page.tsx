import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate } from "@/lib/utils";
import { listPRs, deletePR } from "@/server/actions/procurement";
import { Plus, Eye } from "lucide-react";

function PRStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "secondary" | "warning" | "success" | "destructive" | "outline"> = {
    DRAFT: "secondary",
    SUBMITTED: "warning",
    APPROVED: "success",
    REJECTED: "destructive",
    PO_RAISED: "outline",
  };
  return (
    <Badge variant={variants[status] ?? "secondary"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export default async function PurchaseRequisitionsPage() {
  const rows = await listPRs();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Purchase Requisitions"
        description="Manage internal purchase requests before raising purchase orders."
        action={
          <Button asChild>
            <Link href="/procurement/purchase-requisitions/new">
              <Plus className="size-4" /> New PR
            </Link>
          </Button>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No purchase requisitions yet"
          description="Create a requisition to request items for procurement."
          action={
            <Button asChild>
              <Link href="/procurement/purchase-requisitions/new">
                <Plus className="size-4" /> New PR
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="hidden md:table-cell">Required By</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ pr, lineCount }) => (
                <TableRow key={pr.id}>
                  <TableCell className="font-mono text-xs font-medium">{pr.number}</TableCell>
                  <TableCell><PRStatusBadge status={pr.status} /></TableCell>
                  <TableCell className="text-right">{lineCount}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {pr.requiredByDate ? formatDate(pr.requiredByDate) : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(pr.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/procurement/purchase-requisitions/${pr.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    {pr.status === "DRAFT" && (
                      <DeleteButton id={pr.id} action={deletePR} confirmMessage="Delete this purchase requisition?" />
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
