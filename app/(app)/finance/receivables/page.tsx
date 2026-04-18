import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Receivables" description="Customer invoices and collections." todo={["Aging report", "Receive payments", "Statements"]} />;
}
