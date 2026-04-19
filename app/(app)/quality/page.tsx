import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatDate, formatNumber } from "@/lib/utils";
import { listChecks, deleteCheck, listTemplates, listQcReferences, qcStats } from "@/server/actions/quality";
import { CheckDialog } from "./check-dialog";

const RESULT_VARIANTS: Record<string, "success" | "destructive" | "warning"> = {
  PASS: "success",
  FAIL: "destructive",
  HOLD: "warning",
};

export default async function QualityPage() {
  const [checks, stats, templates, brewRefs, distRefs, bottlingRefs, grnRefs, agingRefs] = await Promise.all([
    listChecks(),
    qcStats(),
    listTemplates(),
    listQcReferences("BREW"),
    listQcReferences("DISTILLATION"),
    listQcReferences("BOTTLING"),
    listQcReferences("GRN"),
    listQcReferences("AGING"),
  ]);

  const refsByType = {
    BREW: brewRefs,
    DISTILLATION: distRefs,
    BOTTLING: bottlingRefs,
    GRN: grnRefs,
    AGING: agingRefs,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quality Control"
        description="QC checkpoints, hold/release, non-conformances."
        action={<CheckDialog templates={templates} refsByType={refsByType} />}
      />

      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Checks (30d)" value={formatNumber(stats.checks30.total ?? 0, 0)} />
          <StatCard label="Pass rate" value={
            stats.checks30.total
              ? `${Math.round(((stats.checks30.passed ?? 0) / stats.checks30.total) * 100)}%`
              : "—"
          } tone={stats.checks30.total && stats.checks30.failed === 0 ? "success" : "default"} />
          <StatCard label="Open NCRs" value={formatNumber(stats.ncs.open ?? 0, 0)} tone={(stats.ncs.critical ?? 0) > 0 ? "danger" : "default"} />
          <StatCard label="Batches on hold" value={formatNumber(stats.heldBatches, 0)} tone={stats.heldBatches > 0 ? "warning" : "default"} />
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <ModuleLink href="/quality/templates" title="Check templates" description="Reusable spec ranges per stage & product." />
        <ModuleLink href="/quality/non-conformance" title="Non-conformances" description="Issues, root cause, CAPA & disposition." />
        <ModuleLink href="/quality/batches" title="Hold / Release" description="Quarantined and on-hold stock batches." />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent QC checks</CardTitle>
            <CardDescription>Last 300 inspections across all references.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {checks.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No QC checks yet"
                description="Record a check against a brew, distillation, bottling run, or GRN."
                action={<CheckDialog templates={templates} refsByType={refsByType} />}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Check</TableHead>
                  <TableHead className="text-right">Measured</TableHead>
                  <TableHead>Spec</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="w-16 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map(({ check, template }) => (
                  <TableRow key={check.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(check.checkedAt)}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {check.refType} · {check.refId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs">{check.stage ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{check.checkType}</div>
                      {template?.name && <div className="text-xs text-muted-foreground">{template.name}</div>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {check.measuredValue != null ? `${formatNumber(check.measuredValue, 3)} ${check.unit ?? ""}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {check.minSpec != null || check.maxSpec != null
                        ? `${check.minSpec ?? "−∞"} – ${check.maxSpec ?? "+∞"}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={RESULT_VARIANTS[check.result] ?? "outline"}>{check.result}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteButton id={check.id} action={deleteCheck} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const toneClass = tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : tone === "danger" ? "text-destructive" : "";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
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
        <Button asChild variant="outline" size="sm">
          <Link href={href}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
