import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="New order" description="Sales rep order capture." todo={["Pick customer", "Add line items", "Submit & sync"]} />;
}
