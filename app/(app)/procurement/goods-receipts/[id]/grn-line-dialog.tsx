"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
import { upsertGRNLine } from "@/server/actions/procurement";

export function GRNLineDialog({
  grnId,
  products,
}: {
  grnId: string;
  products: { id: string; sku: string; name: string; uom: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertGRNLine, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Line added");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="size-4" /> Add line</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add GRN line</DialogTitle>
          <DialogDescription>Record the product received, quantity, lot and expiry.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="grnId" value={grnId} />
          <div>
            <Label>Product *</Label>
            <Select name="productId">
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.sku} — {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError state={state} field="productId" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="qtyOrdered">Ordered</Label>
              <Input id="qtyOrdered" name="qtyOrdered" type="number" step="0.001" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="qtyReceived">Received *</Label>
              <Input id="qtyReceived" name="qtyReceived" type="number" step="0.001" required />
              <FormError state={state} field="qtyReceived" />
            </div>
            <div>
              <Label htmlFor="qtyRejected">Rejected</Label>
              <Input id="qtyRejected" name="qtyRejected" type="number" step="0.001" defaultValue="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="unitCost">Unit cost (TZS)</Label>
              <Input id="unitCost" name="unitCost" type="number" step="0.01" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="lotNumber">Lot / batch no.</Label>
              <Input id="lotNumber" name="lotNumber" placeholder="e.g. LOT-240101" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expiryDate">Expiry date</Label>
              <Input id="expiryDate" name="expiryDate" type="date" />
            </div>
            <div>
              <Label htmlFor="manufacturedOn">Mfg. date</Label>
              <Input id="manufacturedOn" name="manufacturedOn" type="date" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="qcPassed" defaultChecked={true} />
            QC passed
          </label>
          <div>
            <Label htmlFor="rejectionReason">Rejection reason</Label>
            <Textarea id="rejectionReason" name="rejectionReason" rows={2} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Add line</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
