"use client";

import { useActionState, useEffect, useState } from "react";
import { Droplet } from "lucide-react";
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
import { fillBarrel } from "@/server/actions/production";

type Barrel = { id: string; code: string; capacity: number; status: string };
type Option = { id: string; sku?: string; name: string };

export function FillBarrelDialog({ barrels, products }: { barrels: Barrel[]; products: Option[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(fillBarrel, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Barrel filled");
      setOpen(false);
    }
  }, [state]);

  const available = barrels.filter((b) => b.status === "EMPTY" || b.status === "EMPTIED");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Droplet className="size-4" /> Fill barrel</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fill a barrel</DialogTitle>
          <DialogDescription>Create an aging batch by filling an empty barrel.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <div>
            <Label htmlFor="barrelId">Barrel *</Label>
            <select
              id="barrelId"
              name="barrelId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select empty barrel…</option>
              {available.map((b) => (
                <option key={b.id} value={b.id}>{b.code} ({b.capacity}L)</option>
              ))}
            </select>
            <FormError state={state} field="barrelId" />
          </div>

          <div>
            <Label htmlFor="productId">Product *</Label>
            <select
              id="productId"
              name="productId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
            <FormError state={state} field="productId" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fillVolume">Fill volume (L) *</Label>
              <Input id="fillVolume" name="fillVolume" type="number" step="0.1" min="0.1" required />
              <FormError state={state} field="fillVolume" />
            </div>
            <div>
              <Label htmlFor="fillAbv">Fill ABV % *</Label>
              <Input id="fillAbv" name="fillAbv" type="number" step="0.01" min="0" max="100" required />
              <FormError state={state} field="fillAbv" />
            </div>
          </div>

          <div>
            <Label htmlFor="filledAt">Filled on *</Label>
            <Input id="filledAt" name="filledAt" type="date" defaultValue={today} required />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Fill</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
