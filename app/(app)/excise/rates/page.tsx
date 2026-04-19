import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listExciseRates, deleteExciseRate } from "@/server/actions/excise";
import { RateDialog } from "./rate-dialog";

export default async function RatesPage() {
  const rows = await listExciseRates();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Excise Rates"
        description="Per-product-class duty rates. The most recent rate effective on or before the movement date is applied."
        action={<RateDialog />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No rates configured"
          description="Add the current TRA excise rate for each product class you produce."
          action={<RateDialog />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product class</TableHead>
                <TableHead className="text-right">Rate / Litre</TableHead>
                <TableHead className="text-right">Rate / LoA</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.productClass}</TableCell>
                  <TableCell className="text-right font-mono">
                    {r.ratePerLitre != null ? formatCurrency(r.ratePerLitre) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {r.ratePerLitreOfAlcohol != null ? formatCurrency(r.ratePerLitreOfAlcohol) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(r.effectiveFrom)}</TableCell>
                  <TableCell className="text-right">
                    <RateDialog rate={r} />
                    <DeleteButton id={r.id} action={deleteExciseRate} />
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
