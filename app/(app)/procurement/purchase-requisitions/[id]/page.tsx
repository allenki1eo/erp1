import { notFound } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/crud/delete-button";
import { ActionButton } from "@/components/crud/action-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getPR,
  submitPR,
  approvePR,
  deletePRLine,
  listProductsForSelect,
} from "@/server/actions/procurement";
import { PRLineDialog } from "../pr-line-dialog";
import { ArrowLeft } from "lucide-react";

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

function LineStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "OPEN" ? "secondary" : status === "ORDERED" ? "outline" : "success"}>
      {status}
    </Badge>
  );
}

export default async function PRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, products] = await Promise.all([getPR(id), listProductsForSelect()]);
  if (!data) notFound();

  const { pr, lines } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Purchase Requisition ${pr.number}`}
        description={pr.notes ?? ""}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/procurement/purchase-requisitions">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        }
      />

      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Header</CardTitle>
            <PRStatusBadge status={pr.status} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Number</dt>
              <dd className="font-mono font-medium">{pr.number}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd><PRStatusBadge status={pr.status} /></dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Required By</dt>
              <dd>{pr.requiredByDate ? formatDate(pr.requiredByDate) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(pr.createdAt)}</dd>
            </div>
          </dl>
          {pr.notes && (
            <p className="mt-3 text-sm text-muted-foreground">{pr.notes}</p>
          )}

          {/* Status workflow buttons */}
          <div className="mt-4 flex gap-2">
            {pr.status === "DRAFT" && (
              <ActionButton
                action={submitPR.bind(null, pr.id)}
                variant="outline"
                size="sm"
                successMessage="Submitted for approval"
              >
                Submit for Approval
              </ActionButton>
            )}
            {pr.status === "SUBMITTED" && (
              <ActionButton
                action={approvePR.bind(null, pr.id)}
                size="sm"
                successMessage="Approved"
              >
                Approve
              </ActionButton>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lines ({lines.length})</CardTitle>
            {(pr.status === "DRAFT" || pr.status === "SUBMITTED") && (
              <PRLineDialog requisitionId={pr.id} products={products} />
            )}
          </div>
        </CardHeader>
        {lines.length === 0 ? (
          <CardContent>
            <p className="py-6 text-center text-sm text-muted-foreground">No lines yet. Add the first line.</p>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Est. Unit Cost</TableHead>
                  <TableHead className="text-right">Est. Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(({ line, product }) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.description}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {product ? `${product.sku} — ${product.name}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">{line.qty}</TableCell>
                    <TableCell>{line.uom}</TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      {formatCurrency(line.estimatedUnitCost ?? 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.estimatedTotal ?? 0)}
                    </TableCell>
                    <TableCell><LineStatusBadge status={line.status} /></TableCell>
                    <TableCell className="text-right">
                      {pr.status === "DRAFT" && (
                        <>
                          <PRLineDialog requisitionId={pr.id} line={line} products={products} />
                          <DeleteButton id={line.id} action={deletePRLine} confirmMessage="Delete this line?" />
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
