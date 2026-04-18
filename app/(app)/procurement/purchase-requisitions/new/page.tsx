import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/crud/submit-button";
import { createPR } from "@/server/actions/procurement";

async function createAndRedirect(_: unknown, formData: FormData) {
  "use server";
  const result = await createPR(null, formData);
  if (result.ok) {
    redirect("/procurement/purchase-requisitions");
  }
  return result;
}

export default function NewPurchaseRequisitionPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="New Purchase Requisition"
        description="Create a new purchase request."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Requisition Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAndRedirect} className="space-y-4">
            <div>
              <Label htmlFor="requiredByDate">Required By Date</Label>
              <Input id="requiredByDate" name="requiredByDate" type="date" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="Describe the purpose of this requisition…" />
            </div>
            <SubmitButton>Create Requisition</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
