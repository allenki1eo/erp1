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
import { upsertPRLine } from "@/server/actions/procurement";

type PRLine = {
  id: string;
  description: string;
  qty: number;
  uom: string;
  estimatedUnitCost: number | null;
  estimatedTotal: number | null;
  productId: string | null;
  status: string;
};

type Product = { id: string; sku: string; name: string; uom: string };

export function PRLineDialog({
  requisitionId,
  line,
  products,
}: {
  requisitionId: string;
  line?: PRLine;
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertPRLine, null);

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{line ? "Edit Line" : "Add Line"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="requisitionId" value={requisitionId} />
          {line && <input type="hidden" name="id" value={line.id} />}

          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              name="description"
              defaultValue={line?.description ?? ""}
              required
              placeholder="Item description"
            />
            <FormError state={state} field="description" />
          </div>

          <div>
            <Label htmlFor="productId">Product (optional)</Label>
            <Select name="productId" defaultValue={line?.productId ?? "__none"}>
              <SelectTrigger>
                <SelectValue placeholder="Select product…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— None —</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="qty">Qty *</Label>
              <Input
                id="qty"
                name="qty"
                type="number"
                step="0.001"
                min="0.001"
                defaultValue={line?.qty ?? ""}
                required
              />
              <FormError state={state} field="qty" />
            </div>
            <div>
              <Label htmlFor="uom">UOM</Label>
              <Input
                id="uom"
                name="uom"
                defaultValue={line?.uom ?? "PCS"}
                placeholder="PCS"
              />
            </div>
            <div>
              <Label htmlFor="estimatedUnitCost">Est. Unit Cost</Label>
              <Input
                id="estimatedUnitCost"
                name="estimatedUnitCost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={line?.estimatedUnitCost ?? ""}
                placeholder="0"
              />
            </div>
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{line ? "Save" : "Add"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
