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
import { upsertBrew } from "@/server/actions/production";

type Brew = {
  id: string;
  batchNumber: string;
  productId: string;
  recipeId: string | null;
  vesselId: string | null;
  plannedVolume: number;
  actualVolume: number | null;
  startDate: Date;
  endDate: Date | null;
  status: string;
  finalAbv: number | null;
  yieldPercent: number | null;
  notes: string | null;
};

type Option = { id: string; name: string; sku?: string };

const STATUSES = ["PLANNED", "MASHING", "BOILING", "FERMENTING", "CONDITIONING", "PACKAGED", "CANCELLED"];

function toDateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function BrewDialog({
  brew, products, recipes,
}: {
  brew?: Brew;
  products: Option[];
  recipes: { id: string; name: string; version: string; productId: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(brew?.productId ?? "");
  const [state, action] = useActionState(upsertBrew, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(brew ? "Brew updated" : "Brew created");
      setOpen(false);
    }
  }, [state, brew]);

  const today = new Date().toISOString().slice(0, 10);
  const filteredRecipes = productId ? recipes.filter((r) => r.productId === productId) : recipes;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {brew ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New brew</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brew ? "Edit brew" : "New brew"}</DialogTitle>
          <DialogDescription>Batch sheet for a beer brew.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          {brew && <input type="hidden" name="id" value={brew.id} />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="batchNumber">Batch # *</Label>
              <Input id="batchNumber" name="batchNumber" defaultValue={brew?.batchNumber} required />
              <FormError state={state} field="batchNumber" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={brew?.status ?? "PLANNED"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="productId">Product *</Label>
            <select
              id="productId"
              name="productId"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
            <FormError state={state} field="productId" />
          </div>

          <div>
            <Label htmlFor="recipeId">Recipe</Label>
            <select
              id="recipeId"
              name="recipeId"
              defaultValue={brew?.recipeId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">— None —</option>
              {filteredRecipes.map((r) => (
                <option key={r.id} value={r.id}>{r.name} v{r.version}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="plannedVolume">Planned volume (L) *</Label>
              <Input id="plannedVolume" name="plannedVolume" type="number" step="0.1" min="0"
                defaultValue={brew?.plannedVolume} required />
              <FormError state={state} field="plannedVolume" />
            </div>
            <div>
              <Label htmlFor="actualVolume">Actual volume (L)</Label>
              <Input id="actualVolume" name="actualVolume" type="number" step="0.1" min="0"
                defaultValue={brew?.actualVolume ?? ""} />
            </div>
          </div>

          <div>
            <Label htmlFor="vesselId">Vessel / Tank</Label>
            <Input id="vesselId" name="vesselId" defaultValue={brew?.vesselId ?? ""} placeholder="e.g. FV-01" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Start date *</Label>
              <Input id="startDate" name="startDate" type="date"
                defaultValue={toDateInput(brew?.startDate) || today} required />
              <FormError state={state} field="startDate" />
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={toDateInput(brew?.endDate)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="finalAbv">Final ABV %</Label>
              <Input id="finalAbv" name="finalAbv" type="number" step="0.01" min="0" max="100"
                defaultValue={brew?.finalAbv ?? ""} />
            </div>
            <div>
              <Label htmlFor="yieldPercent">Yield %</Label>
              <Input id="yieldPercent" name="yieldPercent" type="number" step="0.1" min="0"
                defaultValue={brew?.yieldPercent ?? ""} />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={brew?.notes ?? ""} />
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{brew ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
