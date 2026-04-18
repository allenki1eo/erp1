import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentCompany, getCurrentUser } from "@/lib/tenant";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const company = await getCurrentCompany();

  const tiles = [
    { label: "Production today (L)", value: "—" },
    { label: "Stock value (TZS)", value: "—" },
    { label: "Open sales orders", value: "—" },
    { label: "Receivables (TZS)", value: "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          {company ? `Active company: ${company.name}` : "No active company selected"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader className="pb-2">
              <CardDescription>{t.label}</CardDescription>
              <CardTitle className="text-3xl">{t.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent brews</CardTitle>
            <CardDescription>Latest beer production batches</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data yet.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top selling SKUs</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data yet.</CardContent>
        </Card>
      </div>
    </div>
  );
}
