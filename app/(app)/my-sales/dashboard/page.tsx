import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCurrentUser } from "@/lib/tenant";
import { formatCurrency } from "@/lib/utils";

export default async function MySalesDashboard() {
  const user = await getCurrentUser();

  // Placeholders — wire up to sales-kpi service later.
  const kpis = [
    { label: "Sales MTD", value: formatCurrency(0) },
    { label: "Target MTD", value: formatCurrency(0) },
    { label: "Customers visited", value: "0" },
    { label: "Outstanding", value: formatCurrency(0) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Sales</h1>
          <p className="text-muted-foreground">Hello {user?.name ?? user?.email}, here's your day.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link href="/my-sales/new-order">New order</Link></Button>
          <Button asChild variant="outline"><Link href="/my-sales/visits">Log visit</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-2xl">{k.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top SKUs (MTD)</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data yet.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Today's route</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">No data yet.</CardContent>
        </Card>
      </div>
    </div>
  );
}
