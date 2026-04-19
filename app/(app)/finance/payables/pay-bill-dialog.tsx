"use client";

import { useActionState, useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { paySupplierBill } from "@/server/actions/finance";
import { formatCurrency } from "@/lib/utils";

export function PayBillDialog({
  invoice,
}: {
  invoice: { id: string; ref: string; outstanding: number };
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(paySupplierBill, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Payment recorded");
      setOpen(false);
    }
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Receipt className="size-4" /> Pay</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay supplier bill</DialogTitle>
          <DialogDescription>
            {invoice.ref} · Outstanding {formatCurrency(invoice.outstanding)}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paidAt">Date *</Label>
              <Input id="paidAt" name="paidAt" type="date" defaultValue={today} required />
            </div>
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={invoice.outstanding} required />
            </div>
          </div>
          <div>
            <Label htmlFor="method">Method *</Label>
            <select
              id="method"
              name="method"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="BANK">Bank transfer</option>
              <option value="CASH">Cash</option>
              <option value="MOBILE_MONEY">Mobile money</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          <div>
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" name="reference" placeholder="Wire ref / cheque no." />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Record</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
