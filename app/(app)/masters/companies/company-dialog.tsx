"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { upsertCompany } from "@/server/actions/companies";

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
  isActive: boolean;
};

export function CompanyDialog({ company }: { company?: Company }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertCompany, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(company ? "Company updated" : "Company created");
      setOpen(false);
    }
  }, [state, company]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {company ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New company</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? "Edit company" : "New company"}</DialogTitle>
          <DialogDescription>
            {company ? "Update company details and settings." : "Create a new company/tenant in the system."}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {company && <input type="hidden" name="id" value={company.id} />}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" name="name" defaultValue={company?.name} required />
              <FormError state={state} field="name" />
            </div>

            <div>
              <Label htmlFor="legalName">Legal Name</Label>
              <Input id="legalName" name="legalName" defaultValue={company?.legalName ?? ""} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="tin">TIN (Tax ID)</Label>
                <Input id="tin" name="tin" defaultValue={company?.tin ?? ""} placeholder="Tanzania Tax ID" />
              </div>
              <div>
                <Label htmlFor="vrn">VRN (VAT Reg. No)</Label>
                <Input id="vrn" name="vrn" defaultValue={company?.vrn ?? ""} placeholder="VAT Registration Number" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" defaultValue={company?.country ?? "TZ"} />
              </div>
              <div>
                <Label htmlFor="baseCurrency">Base Currency</Label>
                <Input id="baseCurrency" name="baseCurrency" defaultValue={company?.baseCurrency ?? "TZS"} />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" defaultValue={company?.address ?? ""} rows={2} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={company?.phone ?? ""} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={company?.email ?? ""} />
                <FormError state={state} field="email" />
              </div>
            </div>

            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" name="logoUrl" defaultValue={company?.logoUrl ?? ""} placeholder="https://..." />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={company?.isActive ?? true} />
              Active
            </label>
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{company ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
