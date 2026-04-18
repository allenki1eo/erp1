import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Reports" description="Production yield, sales, inventory, finance." todo={["Sales by rep / region / SKU", "Production yield & loss", "Inventory aging", "Margin analysis"]} />;
}
