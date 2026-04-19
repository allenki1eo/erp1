"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { addOrderLine } from "@/server/actions/sales";

type Product = { id: string; sku: string; name: string; uom: string; sellingPrice: number | null };

export function OrderLineDialog({
  orderId, products,
}: {
  orderId: string;
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(addOrderLine, null);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Line added");
      setOpen(false);
      setSelected(null);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="size-4" /> Add line</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add line item</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />
          <div>
            <Label htmlFor="productId">Product *</Label>
            <select
              id="productId"
              name="productId"
              required
              onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value) ?? null;
                setSelected(p);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
              ))}
            </select>
            <FormError state={state} field="productId" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qty">Qty *</Label>
              <Input id="qty" name="qty" type="number" step="0.01" min="0.01" required />
            </div>
            <div>
              <Label htmlFor="uom">UOM *</Label>
              <Input id="uom" name="uom" defaultValue={selected?.uom ?? ""} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitPrice">Unit price *</Label>
              <Input
                id="unitPrice" name="unitPrice" type="number" step="0.01" min="0"
                defaultValue={selected?.sellingPrice ?? ""}
                required
              />
            </div>
            <div>
              <Label htmlFor="discount">Discount</Label>
              <Input id="discount" name="discount" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>
          <div>
            <Label htmlFor="taxRate">Tax rate (0–1)</Label>
            <Input id="taxRate" name="taxRate" type="number" step="0.01" min="0" max="1" defaultValue="0.18" />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Add</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
