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
import { upsertPOLine } from "@/server/actions/procurement";

type POLine = {
  id: string;
  productId: string;
  description: string | null;
  qty: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
};

type Product = { id: string; sku: string; name: string; uom: string };

export function POLineDialog({
  poId,
  line,
  products,
}: {
  poId: string;
  line?: POLine;
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertPOLine, null);

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
          <input type="hidden" name="poId" value={poId} />
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

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={line?.description ?? ""}
              placeholder="Optional override"
            />
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
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={line?.unitPrice ?? ""}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="taxRate">Tax %</Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={line ? line.taxRate * 100 : ""}
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
