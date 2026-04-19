import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { listTemplates, deleteTemplate } from "@/server/actions/quality";
import { listProductsForSelect } from "@/server/actions/procurement";
import { TemplateDialog } from "./template-dialog";

export default async function TemplatesPage() {
  const [rows, products] = await Promise.all([
    listTemplates(),
    listProductsForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="QC Check Templates"
        description="Reusable check specs per stage and product. Define once, apply at each QC checkpoint."
        action={<TemplateDialog products={products} />}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create a template to standardise checkpoints (e.g. 'Lager MASH pH 5.2–5.6')."
          action={<TemplateDialog products={products} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Check</TableHead>
                <TableHead>Class / Product</TableHead>
                <TableHead>Spec</TableHead>
                <TableHead>Rules</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ tpl, product }) => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-medium">{tpl.name}</TableCell>
                  <TableCell className="text-xs font-mono">{tpl.refType}</TableCell>
                  <TableCell className="text-xs">{tpl.stage ?? "—"}</TableCell>
                  <TableCell>{tpl.checkType}</TableCell>
                  <TableCell className="text-xs">
                    {product?.name ?? (tpl.productClass ?? "Any")}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {tpl.minSpec ?? "−∞"} – {tpl.maxSpec ?? "+∞"} {tpl.unit ?? ""}
                  </TableCell>
                  <TableCell className="space-x-1">
                    {tpl.mandatory && <Badge variant="secondary">Mandatory</Badge>}
                    {tpl.holdOnFail && <Badge variant="warning">Hold on fail</Badge>}
                    {!tpl.isActive && <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <TemplateDialog products={products} template={tpl} />
                    <DeleteButton id={tpl.id} action={deleteTemplate} />
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
