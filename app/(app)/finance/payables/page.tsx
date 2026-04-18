import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Payables" description="Supplier bills and payments." todo={["Bill entry", "Pay runs", "Aging report"]} />;
}
