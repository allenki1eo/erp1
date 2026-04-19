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
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { upsertRecipe } from "@/server/actions/recipes";

type Recipe = {
  id: string;
  productId: string;
  name: string;
  version: string;
  expectedYield: number;
  expectedAbv: number | null;
  notes: string | null;
  isActive: boolean;
};

type Option = { id: string; sku?: string; name: string };

export function RecipeDialog({ recipe, products }: { recipe?: Recipe; products: Option[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertRecipe, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(recipe ? "Recipe updated" : "Recipe created");
      setOpen(false);
    }
  }, [state, recipe]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {recipe ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New recipe</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{recipe ? "Edit recipe" : "New recipe"}</DialogTitle>
          <DialogDescription>Grain/mash bill header. Add items after creation.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          {recipe && <input type="hidden" name="id" value={recipe.id} />}

          <div>
            <Label htmlFor="productId">Target product *</Label>
            <select
              id="productId"
              name="productId"
              required
              defaultValue={recipe?.productId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
            <FormError state={state} field="productId" />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" defaultValue={recipe?.name} required />
              <FormError state={state} field="name" />
            </div>
            <div className="w-20">
              <Label htmlFor="version">Version</Label>
              <Input id="version" name="version" defaultValue={recipe?.version ?? "1.0"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expectedYield">Expected yield (L) *</Label>
              <Input id="expectedYield" name="expectedYield" type="number" step="0.1" min="0.1"
                defaultValue={recipe?.expectedYield} required />
              <FormError state={state} field="expectedYield" />
            </div>
            <div>
              <Label htmlFor="expectedAbv">Expected ABV %</Label>
              <Input id="expectedAbv" name="expectedAbv" type="number" step="0.01" min="0" max="100"
                defaultValue={recipe?.expectedAbv ?? ""} />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={recipe?.notes ?? ""} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={recipe ? recipe.isActive : true} />
            Active
          </label>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{recipe ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
