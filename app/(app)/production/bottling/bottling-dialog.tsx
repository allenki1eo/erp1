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
import { upsertBottling } from "@/server/actions/production";

type Run = {
  id: string;
  runNumber: string;
  finishedProductId: string;
  sourceBatchId: string | null;
  sourceType: string | null;
  plannedQty: number;
  actualQty: number | null;
  uom: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  notes: string | null;
};

type Option = { id: string; sku?: string; name: string };

const STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const SOURCE_TYPES = ["BREW", "AGING", "BLEND"];
const UOMS = ["PCS", "CASE", "L"];

function toDateInput(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function BottlingDialog({ run, products }: { run?: Run; products: Option[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertBottling, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(run ? "Run updated" : "Run created");
      setOpen(false);
    }
  }, [state, run]);

  const today = new Date().toISOString().slice(0, 10);

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
          <DialogTitle>{run ? "Edit bottling run" : "New bottling run"}</DialogTitle>
          <DialogDescription>Convert a bulk batch into a finished, packaged product.</DialogDescription>
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
            <Label htmlFor="finishedProductId">Finished product *</Label>
            <select
              id="finishedProductId"
              name="finishedProductId"
              required
              defaultValue={run?.finishedProductId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
            <FormError state={state} field="finishedProductId" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sourceType">Source type</Label>
              <select
                id="sourceType"
                name="sourceType"
                defaultValue={run?.sourceType ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="">— None —</option>
                {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="sourceBatchId">Source batch ID</Label>
              <Input id="sourceBatchId" name="sourceBatchId" defaultValue={run?.sourceBatchId ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="plannedQty">Planned qty *</Label>
              <Input id="plannedQty" name="plannedQty" type="number" step="1" min="1"
                defaultValue={run?.plannedQty} required />
              <FormError state={state} field="plannedQty" />
            </div>
            <div>
              <Label htmlFor="actualQty">Actual qty</Label>
              <Input id="actualQty" name="actualQty" type="number" step="1" min="0"
                defaultValue={run?.actualQty ?? ""} />
            </div>
            <div>
              <Label htmlFor="uom">UoM</Label>
              <select
                id="uom"
                name="uom"
                defaultValue={run?.uom ?? "PCS"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
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
