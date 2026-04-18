import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getActiveCompanyId } from "@/lib/tenant";
import { canSeeAllCompaniesTransport } from "@/lib/rbac";
import { listSpares, deleteSpare } from "@/server/actions/transport";
import { listAccessibleCompanies } from "@/server/actions/company-list";
import { SpareDialog } from "./spare-dialog";

export default async function SparesPage() {
  const [rows, companies, activeId, crossCompany] = await Promise.all([
    listSpares(),
    listAccessibleCompanies(),
    getActiveCompanyId(),
    canSeeAllCompaniesTransport(),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Spare parts"
        description={crossCompany ? "Spares across all companies." : "Spares for the active company."}
        action={<SpareDialog companies={companies} defaultCompanyId={activeId} />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No spare parts yet"
          description="Stock up on filters, oils, tyres and other parts."
          action={<SpareDialog companies={companies} defaultCompanyId={activeId} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part no.</TableHead>
                <TableHead>Name</TableHead>
                {crossCompany && <TableHead>Company</TableHead>}
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">UoM</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="hidden md:table-cell text-right">Reorder</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ spare, company }) => {
                const low = spare.qtyOnHand <= spare.reorderLevel;
                return (
                  <TableRow key={spare.id}>
                    <TableCell className="font-mono text-xs">{spare.partNumber}</TableCell>
                    <TableCell className="font-medium">{spare.name}</TableCell>
                    {crossCompany && <TableCell className="text-sm text-muted-foreground">{company?.name ?? "—"}</TableCell>}
                    <TableCell className="hidden md:table-cell">{spare.category ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{spare.uom}</TableCell>
                    <TableCell className="text-right">
                      <span className={low ? "font-medium text-destructive" : ""}>{formatNumber(spare.qtyOnHand, 2)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">{formatNumber(spare.reorderLevel, 2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(spare.unitCost)}</TableCell>
                    <TableCell>
                      {!spare.isActive ? <Badge variant="secondary">Inactive</Badge>
                        : low ? <Badge variant="warning">Reorder</Badge>
                        : <Badge variant="success">In stock</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <SpareDialog spare={spare} companies={companies} />
                      <DeleteButton id={spare.id} action={deleteSpare} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
