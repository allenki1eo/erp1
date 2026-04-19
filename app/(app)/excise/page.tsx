import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { exciseStats } from "@/server/actions/excise";

export default async function ExciseDashboard() {
  const stats = await exciseStats();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Excise & Regulatory"
        description="Tanzania TRA excise duty, tax stamps, bonded warehouse movements, and statutory returns."
      />

      {stats && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <StatCard label="Duty-paid removals (30d)" value={`${formatNumber(stats.mtd.totalLitres, 1)} L`} sub={formatCurrency(stats.mtd.totalExcise)} />
          <StatCard label="Declarations pending" value={formatNumber(stats.pending.count, 0)} sub={formatCurrency(stats.pending.excise)} tone={stats.pending.count > 0 ? "warning" : "default"} />
          <StatCard label="Stamp stock" value={formatNumber(stats.stampStock.remaining, 0)} sub={`${formatNumber(stats.stampStock.rolls, 0)} active rolls`} />
          <StatCard label="30-day movements" value={formatNumber(stats.mtd.count, 0)} sub="duty-paid removals" />
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <ModuleLink
          href="/excise/rates"
          title="Excise rates"
          description="Per-product-class duty rates (TZS/L or TZS/LoA) with effective dates."
        />
        <ModuleLink
          href="/excise/stamps"
          title="Tax stamps"
          description="TRA-issued stamp rolls, serial ranges, and allocations to bottling runs."
        />
        <ModuleLink
          href="/excise/bonded"
          title="Bonded warehouse"
          description="Duty-suspended stock movements: entries, duty-paid removals, exports, losses."
        />
        <ModuleLink
          href="/excise/declarations"
          title="Statutory declarations"
          description="Monthly TRA returns aggregated from duty-paid removals."
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "warning" | "danger" }) {
  const toneClass = tone === "warning" ? "text-amber-600" : tone === "danger" ? "text-destructive" : "";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ModuleLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm"><Link href={href}>Open</Link></Button>
      </CardContent>
    </Card>
  );
}
