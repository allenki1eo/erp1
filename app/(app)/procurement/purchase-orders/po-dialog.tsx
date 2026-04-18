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
import { upsertPO } from "@/server/actions/procurement";

type PO = {
  id: string;
  supplierId: string;
  warehouseId: string | null;
  orderDate: Date;
  expectedDate: Date | null;
  notes: string | null;
};

type Supplier = { id: string; name: string; code: string };
type Warehouse = { id: string; name: string; code: string };

function toDateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function PODialog({
  po,
  suppliers,
  warehouses,
}: {
  po?: PO;
  suppliers: Supplier[];
  warehouses: Warehouse[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertPO, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(po ? "Purchase order updated" : "Purchase order created");
      setOpen(false);
    }
  }, [state, po]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {po ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New PO</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{po ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
          <DialogDescription>
            {po ? "Update purchase order header details." : "Create a new purchase order."}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {po && <input type="hidden" name="id" value={po.id} />}

          <div>
            <Label htmlFor="supplierId">Supplier *</Label>
            <Select name="supplierId" defaultValue={po?.supplierId ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier…" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError state={state} field="supplierId" />
          </div>

          <div>
            <Label htmlFor="warehouseId">Deliver to Warehouse</Label>
            <Select name="warehouseId" defaultValue={po?.warehouseId ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="orderDate">Order Date *</Label>
              <Input
                id="orderDate"
                name="orderDate"
                type="date"
                defaultValue={toDateInput(po?.orderDate) || today}
                required
              />
              <FormError state={state} field="orderDate" />
            </div>
            <div>
              <Label htmlFor="expectedDate">Expected Date</Label>
              <Input
                id="expectedDate"
                name="expectedDate"
                type="date"
                defaultValue={toDateInput(po?.expectedDate)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={po?.notes ?? ""} />
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{po ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
