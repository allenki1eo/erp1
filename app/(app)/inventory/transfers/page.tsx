import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Stock Transfers" description="Inter-warehouse movements (e.g. plant → bonded warehouse)." todo={["Create transfer", "In-transit tracking", "Receipt confirmation"]} />;
}
