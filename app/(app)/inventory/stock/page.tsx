import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Stock on hand" description="Live inventory across warehouses." todo={["Filter by warehouse / category", "Stock value", "Reorder alerts"]} />;
}
