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
import { upsertDistillation } from "@/server/actions/production";

type Dist = {
  id: string;
  runNumber: string;
  productId: string;
  recipeId: string | null;
  stillId: string | null;
  startDate: Date;
  endDate: Date | null;
  status: string;
  feedVolume: number | null;
  feedAbv: number | null;
  totalOutput: number | null;
  notes: string | null;
};

type Option = { id: string; sku?: string; name: string };

const STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function toDateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function DistDialog({
  run, products, recipes,
}: {
  run?: Dist;
  products: Option[];
  recipes: { id: string; name: string; version: string; productId: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(run?.productId ?? "");
  const [state, action] = useActionState(upsertDistillation, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(run ? "Run updated" : "Run created");
      setOpen(false);
    }
  }, [state, run]);

  const today = new Date().toISOString().slice(0, 10);
  const filteredRecipes = productId ? recipes.filter((r) => r.productId === productId) : recipes;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {run ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New run</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{run ? "Edit distillation" : "New distillation"}</DialogTitle>
          <DialogDescription>Still run sheet for spirits production.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          {run && <input type="hidden" name="id" value={run.id} />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="runNumber">Run # *</Label>
              <Input id="runNumber" name="runNumber" defaultValue={run?.runNumber} required />
              <FormError state={state} field="runNumber" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={run?.status ?? "PLANNED"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="recipeId">Recipe</Label>
              <select
                id="recipeId"
                name="recipeId"
                defaultValue={run?.recipeId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="">— None —</option>
                {filteredRecipes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} v{r.version}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="stillId">Still</Label>
              <Input id="stillId" name="stillId" defaultValue={run?.stillId ?? ""} placeholder="e.g. POT-01" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="feedVolume">Feed vol (L)</Label>
              <Input id="feedVolume" name="feedVolume" type="number" step="0.1" min="0"
                defaultValue={run?.feedVolume ?? ""} />
            </div>
            <div>
              <Label htmlFor="feedAbv">Feed ABV %</Label>
              <Input id="feedAbv" name="feedAbv" type="number" step="0.01" min="0" max="100"
                defaultValue={run?.feedAbv ?? ""} />
            </div>
            <div>
              <Label htmlFor="totalOutput">Output (L)</Label>
              <Input id="totalOutput" name="totalOutput" type="number" step="0.1" min="0"
                defaultValue={run?.totalOutput ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Start date *</Label>
              <Input id="startDate" name="startDate" type="date"
                defaultValue={toDateInput(run?.startDate) || today} required />
              <FormError state={state} field="startDate" />
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={toDateInput(run?.endDate)} />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={run?.notes ?? ""} />
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{run ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
