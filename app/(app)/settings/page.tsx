import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Settings" description="Users, roles, tax codes, company config." todo={["User management", "Role permissions editor", "Tax code & excise rate setup"]} />;
}
