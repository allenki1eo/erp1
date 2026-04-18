import { ModulePlaceholder } from "@/components/module-placeholder";
export default function Page() {
  return <ModulePlaceholder title="Products" description="SKUs: raw materials, packaging, WIP, finished goods (beer/spirits)." todo={["CRUD SKUs", "ABV & pack-size fields", "Excise rate linking", "Categories tree"]} />;
}
