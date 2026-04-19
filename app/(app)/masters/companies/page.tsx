import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getActiveCompany, listMyCompanies } from "@/server/actions/companies";
import { CompanyForm } from "./company-form";

export default async function CompaniesPage() {
  const [active, mine] = await Promise.all([getActiveCompany(), listMyCompanies()]);

  if (!active) {
    return (
      <div className="space-y-4">
        <PageHeader title="Companies" description="Manage tenant companies and legal info." />
        <EmptyState title="No active company" description="Select a company from the top bar to edit its details." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={active.name}
        description="Legal details, tax IDs, and contact info for the active tenant."
      />

      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Company details
        </h2>
        <CompanyForm company={active} />
      </Card>

      {mine.length > 1 && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            All companies you belong to
          </h2>
          <ul className="space-y-2 text-sm">
            {mine.map(({ company, link }) => (
              <li key={company.id} className="flex items-center justify-between rounded border bg-muted/30 p-3">
                <div>
                  <div className="font-medium">{company.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {company.legalName ?? "—"} · {company.country} · {company.baseCurrency}
                  </div>
                </div>
                <div className="flex gap-2">
                  {company.id === active.id && <Badge variant="success">Active</Badge>}
                  {link.isDefault && <Badge variant="outline">Default</Badge>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
