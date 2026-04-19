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
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { upsertRecipeItem } from "@/server/actions/recipes";

type Item = {
  id: string;
  productId: string;
  quantity: number;
  uom: string;
  stage: string | null;
};

type Option = { id: string; sku?: string; name: string; uom?: string };

const STAGES = ["MASH", "BOIL", "FERMENT", "DISTILL", "BLEND", "BOTTLE"];
const UOMS = ["KG", "G", "L", "ML", "PCS"];

export function RecipeItemDialog({
  recipeId, item, products,
}: {
  recipeId: string;
  item?: Item;
  products: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertRecipeItem, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(item ? "Item updated" : "Item added");
      setOpen(false);
    }
  }, [state, item]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {item ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button size="sm"><Plus className="size-4" /> Add ingredient</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit ingredient" : "Add ingredient"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <input type="hidden" name="recipeId" value={recipeId} />
          {item && <input type="hidden" name="id" value={item.id} />}

          <div>
            <Label htmlFor="productId">Ingredient *</Label>
            <select
              id="productId"
              name="productId"
              required
              defaultValue={item?.productId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
            <FormError state={state} field="productId" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" name="quantity" type="number" step="0.001" min="0.001"
                defaultValue={item?.quantity} required />
              <FormError state={state} field="quantity" />
            </div>
            <div>
              <Label htmlFor="uom">UoM</Label>
              <select
                id="uom"
                name="uom"
                defaultValue={item?.uom ?? "KG"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="stage">Stage</Label>
              <select
                id="stage"
                name="stage"
                defaultValue={item?.stage ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="">—</option>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{item ? "Save" : "Add"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
