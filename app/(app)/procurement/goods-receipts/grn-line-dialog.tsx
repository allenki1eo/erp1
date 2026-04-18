"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { upsertGRNLine } from "@/server/actions/procurement";

type GRNLine = {
  id: string;
  productId: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyRejected: number;
  unitCost: number;
  lotNumber: string | null;
  expiryDate: Date | null;
  qcPassed: boolean;
  rejectionReason: string | null;
};

type Product = { id: string; sku: string; name: string; uom: string };

function toDateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function GRNLineDialog({
  grnId,
  line,
  products,
}: {
  grnId: string;
  line?: GRNLine;
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertGRNLine, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(line ? "Line updated" : "Line added");
      setOpen(false);
    }
  }, [state, line]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {line ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button size="sm"><Plus className="size-4" /> Add Line</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{line ? "Edit Receipt Line" : "Add Receipt Line"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="grnId" value={grnId} />
          {line && <input type="hidden" name="id" value={line.id} />}

          <div>
            <Label htmlFor="productId">Product *</Label>
            <Select name="productId" defaultValue={line?.productId ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select product…" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.sku} — {p.name} ({p.uom})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError state={state} field="productId" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="qtyOrdered">Qty Ordered</Label>
              <Input
                id="qtyOrdered"
                name="qtyOrdered"
                type="number"
                step="0.001"
                min="0"
                defaultValue={line?.qtyOrdered ?? ""}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="qtyReceived">Qty Received *</Label>
              <Input
                id="qtyReceived"
                name="qtyReceived"
                type="number"
                step="0.001"
                min="0.001"
                defaultValue={line?.qtyReceived ?? ""}
                required
              />
              <FormError state={state} field="qtyReceived" />
            </div>
            <div>
              <Label htmlFor="qtyRejected">Qty Rejected</Label>
              <Input
                id="qtyRejected"
                name="qtyRejected"
                type="number"
                step="0.001"
                min="0"
                defaultValue={line?.qtyRejected ?? ""}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="unitCost">Unit Cost</Label>
              <Input
                id="unitCost"
                name="unitCost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={line?.unitCost ?? ""}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="lotNumber">Lot Number</Label>
              <Input
                id="lotNumber"
                name="lotNumber"
                defaultValue={line?.lotNumber ?? ""}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                defaultValue={toDateInput(line?.expiryDate)}
              />
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="qcPassed"
                  defaultChecked={line?.qcPassed ?? true}
                />
                QC Passed
              </label>
            </div>
          </div>

          {line?.qcPassed === false && (
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Input
                id="rejectionReason"
                name="rejectionReason"
                defaultValue={line?.rejectionReason ?? ""}
              />
            </div>
          )}

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{line ? "Save" : "Add"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
