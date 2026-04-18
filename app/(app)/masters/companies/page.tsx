import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Companies" description="Manage tenant companies, branches, and legal info." todo={["Create/edit company", "TIN / VRN setup", "Branch management"]} />;
}
