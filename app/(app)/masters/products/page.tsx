import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { listProducts, deleteProduct } from "@/server/actions/products";
import { ProductDialog } from "./product-dialog";

export default async function ProductsPage() {
  const rows = await listProducts();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description="SKUs: raw materials, packaging, WIP, finished goods."
        action={<ProductDialog />}
      />
      {rows.length === 0 ? (
        <EmptyState title="No products yet" description="Create your first product." action={<ProductDialog />} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">ABV</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{p.type.replace("_", " ")}</Badge></TableCell>
                  <TableCell>{p.productClass ?? "—"}</TableCell>
                  <TableCell className="text-right">{p.abv != null ? `${formatNumber(p.abv * 100, 1)}%` : "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.sellingPrice ?? 0)}</TableCell>
                  <TableCell className="text-right">
                    <ProductDialog product={p} />
                    <DeleteButton id={p.id} action={deleteProduct} />
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
