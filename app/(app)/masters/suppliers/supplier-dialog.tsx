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
import { upsertSupplier } from "@/server/actions/suppliers";

type Supplier = {
  id: string; code: string; name: string;
  tin: string | null; vrn: string | null; phone: string | null;
  email: string | null; address: string | null;
  paymentTerms: number | null; isActive: boolean;
};

export function SupplierDialog({ supplier }: { supplier?: Supplier }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertSupplier, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(supplier ? "Supplier updated" : "Supplier created");
      setOpen(false);
    }
  }, [state, supplier]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {supplier ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New supplier</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "New supplier"}</DialogTitle>
          <DialogDescription>Raw material and packaging vendors.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {supplier && <input type="hidden" name="id" value={supplier.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input id="code" name="code" defaultValue={supplier?.code} required />
              <FormError state={state} field="code" />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment terms (days)</Label>
              <Input id="paymentTerms" name="paymentTerms" type="number" defaultValue={supplier?.paymentTerms ?? 0} />
            </div>
          </div>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={supplier?.name} required />
            <FormError state={state} field="name" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label htmlFor="tin">TIN</Label><Input id="tin" name="tin" defaultValue={supplier?.tin ?? ""} /></div>
            <div><Label htmlFor="vrn">VRN</Label><Input id="vrn" name="vrn" defaultValue={supplier?.vrn ?? ""} /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" defaultValue={supplier?.phone ?? ""} /></div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={supplier?.email ?? ""} />
              <FormError state={state} field="email" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" defaultValue={supplier?.address ?? ""} rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={supplier?.isActive ?? true} />
            Active
          </label>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{supplier ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
