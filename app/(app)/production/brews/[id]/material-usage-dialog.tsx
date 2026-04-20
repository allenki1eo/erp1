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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { addBrewMaterialUsage } from "@/server/actions/production";

const STAGES = ["MASH", "BOIL", "FERMENT", "CONDITION", "BOTTLE"] as const;

type Product = { id: string; sku: string; name: string };

export function MaterialUsageDialog({
  brewId,
  products,
  defaultStage,
}: {
  brewId: string;
  products: Product[];
  defaultStage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(addBrewMaterialUsage, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Material usage logged");
      setOpen(false);
    } else if (state && !state.ok) {
      toast.error(state.error ?? "Failed to log usage");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 size-4" /> Log Usage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Material Usage</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="brewId" value={brewId} />

          <div className="space-y-2">
            <Label>Ingredient</Label>
            <Select name="productId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select ingredient" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError state={state} field="productId" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input name="qty" type="number" step="0.001" min="0.001" required />
              <FormError state={state} field="qty" />
            </div>
            <div className="space-y-2">
              <Label>UoM</Label>
              <Input name="uom" placeholder="kg, L, g…" required />
              <FormError state={state} field="uom" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stage</Label>
            <Select name="stage" defaultValue={defaultStage ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage (optional)" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Save</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
