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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { upsertCustomer } from "@/server/actions/customers";

type Customer = {
  id: string; code: string; name: string; type: string;
  tin: string | null; vrn: string | null; phone: string | null;
  email: string | null; address: string | null; region: string | null;
  creditLimit: number | null; paymentTerms: number | null; isActive: boolean;
};

export function CustomerDialog({ customer }: { customer?: Customer }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertCustomer, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(customer ? "Customer updated" : "Customer created");
      setOpen(false);
    }
  }, [state, customer]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customer ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New customer</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "New customer"}</DialogTitle>
          <DialogDescription>Wholesale, retail, on-trade or off-trade.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {customer && <input type="hidden" name="id" value={customer.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input id="code" name="code" defaultValue={customer?.code} required />
              <FormError state={state} field="code" />
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select name="type" defaultValue={customer?.type ?? "RETAIL"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETAIL">Retail</SelectItem>
                  <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                  <SelectItem value="ON_TRADE">On-trade</SelectItem>
                  <SelectItem value="OFF_TRADE">Off-trade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={customer?.name} required />
            <FormError state={state} field="name" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tin">TIN</Label>
              <Input id="tin" name="tin" defaultValue={customer?.tin ?? ""} />
            </div>
            <div>
              <Label htmlFor="vrn">VRN</Label>
              <Input id="vrn" name="vrn" defaultValue={customer?.vrn ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} />
              <FormError state={state} field="email" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" defaultValue={customer?.address ?? ""} rows={2} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" name="region" defaultValue={customer?.region ?? ""} />
            </div>
            <div>
              <Label htmlFor="creditLimit">Credit limit (TZS)</Label>
              <Input id="creditLimit" name="creditLimit" type="number" step="0.01" defaultValue={customer?.creditLimit ?? 0} />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment terms (days)</Label>
              <Input id="paymentTerms" name="paymentTerms" type="number" defaultValue={customer?.paymentTerms ?? 0} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={customer?.isActive ?? true} />
            Active
          </label>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{customer ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
