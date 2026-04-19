"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { updateActiveCompany } from "@/server/actions/companies";

type Company = {
  id: string;
  name: string;
  legalName: string | null;
  tin: string | null;
  vrn: string | null;
  country: string;
  baseCurrency: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
};

export function CompanyForm({ company }: { company: Company }) {
  const [state, action] = useActionState(updateActiveCompany, null);

  useEffect(() => {
    if (state?.ok) toast.success("Company updated");
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Trading name *</Label>
          <Input id="name" name="name" defaultValue={company.name} required />
          <FormError state={state} field="name" />
        </div>
        <div>
          <Label htmlFor="legalName">Legal name</Label>
          <Input id="legalName" name="legalName" defaultValue={company.legalName ?? ""} />
        </div>
        <div>
          <Label htmlFor="tin">TIN</Label>
          <Input id="tin" name="tin" defaultValue={company.tin ?? ""} />
        </div>
        <div>
          <Label htmlFor="vrn">VRN</Label>
          <Input id="vrn" name="vrn" defaultValue={company.vrn ?? ""} />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={company.country} />
        </div>
        <div>
          <Label htmlFor="baseCurrency">Base currency</Label>
          <Input id="baseCurrency" name="baseCurrency" defaultValue={company.baseCurrency} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={company.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={company.email ?? ""} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" rows={2} defaultValue={company.address ?? ""} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input id="logoUrl" name="logoUrl" type="url" defaultValue={company.logoUrl ?? ""} />
        </div>
      </div>

      <FormError state={state} />
      <div className="flex justify-end">
        <SubmitButton>Save changes</SubmitButton>
      </div>
    </form>
  );
}
