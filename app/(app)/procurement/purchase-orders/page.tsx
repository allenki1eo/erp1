import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Purchase Orders" description="Issue and track POs to suppliers." todo={["Create PO with multi-line", "Approval workflow", "Receive against PO"]} />;
}
