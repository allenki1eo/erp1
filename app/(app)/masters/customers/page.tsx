import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DeleteButton } from "@/components/crud/delete-button";
import { formatCurrency } from "@/lib/utils";
import { listCustomers, deleteCustomer } from "@/server/actions/customers";
import { CustomerDialog } from "./customer-dialog";

export default async function CustomersPage() {
  const rows = await listCustomers();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        description="Wholesale, retail, on-trade, off-trade."
        action={<CustomerDialog />}
      />
      {rows.length === 0 ? (
        <EmptyState title="No customers yet" description="Add your first customer." action={<CustomerDialog />} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Region</TableHead>
                <TableHead className="text-right">Credit limit</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.code}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.type.replace("_", "-")}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell">{c.phone ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{c.region ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.creditLimit ?? 0)}</TableCell>
                  <TableCell className="text-right">
                    <CustomerDialog customer={c} />
                    <DeleteButton id={c.id} action={deleteCustomer} />
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
