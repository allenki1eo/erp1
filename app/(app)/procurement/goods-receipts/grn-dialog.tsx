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
import { upsertGRN } from "@/server/actions/procurement";

type GRN = {
  id: string;
  supplierId: string;
  warehouseId: string;
  poId: string | null;
  receivedDate: Date;
  deliveryNoteNumber: string | null;
  notes: string | null;
};

type Supplier = { id: string; name: string; code?: string };
type Warehouse = { id: string; name: string; code?: string };
type PO = { id: string; number: string };

function toDateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function GRNDialog({
  grn,
  suppliers,
  warehouses,
  pos,
}: {
  grn?: GRN;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  pos: PO[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertGRN, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(grn ? "GRN updated" : "GRN created");
      setOpen(false);
    }
  }, [state, grn]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {grn ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New GRN</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{grn ? "Edit Goods Receipt" : "New Goods Receipt"}</DialogTitle>
          <DialogDescription>
            Record goods received from a supplier.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {grn && <input type="hidden" name="id" value={grn.id} />}

          <div>
            <Label htmlFor="poId">Against Purchase Order (optional)</Label>
            <Select name="poId" defaultValue={grn?.poId ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="— None —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {pos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="supplierId">Supplier *</Label>
            <Select name="supplierId" defaultValue={grn?.supplierId ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier…" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code ? `${s.code} — ` : ""}{s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError state={state} field="supplierId" />
          </div>

          <div>
            <Label htmlFor="warehouseId">Warehouse *</Label>
            <Select name="warehouseId" defaultValue={grn?.warehouseId ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse…" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code ? `${w.code} — ` : ""}{w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError state={state} field="warehouseId" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="receivedDate">Received Date *</Label>
              <Input
                id="receivedDate"
                name="receivedDate"
                type="date"
                defaultValue={toDateInput(grn?.receivedDate) || today}
                required
              />
              <FormError state={state} field="receivedDate" />
            </div>
            <div>
              <Label htmlFor="deliveryNoteNumber">Delivery Note No.</Label>
              <Input
                id="deliveryNoteNumber"
                name="deliveryNoteNumber"
                defaultValue={grn?.deliveryNoteNumber ?? ""}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={grn?.notes ?? ""} />
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{grn ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
