import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Sales Orders" description="Customer orders, picking, dispatch." todo={["Order entry", "Credit limit check", "Pick & dispatch"]} />;
}
