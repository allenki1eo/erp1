import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function TripsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Trips"
        description="Deliveries, collections and transfers logged against vehicles and drivers."
      />
      <EmptyState
        title="Trip logging coming soon"
        description="Trips will be auto-created from sales orders and inventory transfers, and can also be logged manually."
      />
    </div>
  );
}
