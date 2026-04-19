import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { listAllCompanies, deleteCompany } from "@/server/actions/companies";
import { CompanyDialog } from "./company-dialog";

export default async function CompaniesPage() {
  const rows = await listAllCompanies();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Companies"
        description="Manage tenant companies, branches, and legal information."
        action={<CompanyDialog />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No companies yet"
          description="Create your first company to get started."
          action={<CompanyDialog />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Legal Name</TableHead>
                <TableHead>TIN</TableHead>
                <TableHead>VRN</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.legalName ?? "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{c.tin ?? "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{c.vrn ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.country}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.baseCurrency}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CompanyDialog company={c} />
                    <DeleteButton id={c.id} action={deleteCompany} />
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
