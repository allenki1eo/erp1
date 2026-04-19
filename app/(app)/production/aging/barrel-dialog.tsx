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
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { upsertBarrel } from "@/server/actions/production";

type Barrel = {
  id: string;
  code: string;
  capacity: number;
  woodType: string | null;
  charLevel: string | null;
  warehouseId: string | null;
  status: string;
};

type Warehouse = { id: string; name: string; code: string };

const STATUSES = ["EMPTY", "FILLED", "EMPTIED", "RETIRED"];
const WOOD_TYPES = ["OAK_AMERICAN", "OAK_FRENCH", "OAK_HUNGARIAN", "CHESTNUT", "OTHER"];
const CHAR_LEVELS = ["1", "2", "3", "4"];

export function BarrelDialog({ barrel, warehouses }: { barrel?: Barrel; warehouses: Warehouse[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertBarrel, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(barrel ? "Barrel updated" : "Barrel created");
      setOpen(false);
    }
  }, [state, barrel]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {barrel ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button variant="outline" size="sm"><Plus className="size-4" /> New barrel</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{barrel ? "Edit barrel" : "New barrel"}</DialogTitle>
          <DialogDescription>Register a cask for aging tracking.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          {barrel && <input type="hidden" name="id" value={barrel.id} />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input id="code" name="code" defaultValue={barrel?.code} required />
              <FormError state={state} field="code" />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity (L) *</Label>
              <Input id="capacity" name="capacity" type="number" step="0.1" min="1"
                defaultValue={barrel?.capacity} required />
              <FormError state={state} field="capacity" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="woodType">Wood type</Label>
              <select
                id="woodType"
                name="woodType"
                defaultValue={barrel?.woodType ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="">— None —</option>
                {WOOD_TYPES.map((w) => <option key={w} value={w}>{w.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="charLevel">Char level</Label>
              <select
                id="charLevel"
                name="charLevel"
                defaultValue={barrel?.charLevel ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="">— None —</option>
                {CHAR_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="warehouseId">Warehouse</Label>
            <select
              id="warehouseId"
              name="warehouseId"
              defaultValue={barrel?.warehouseId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">— None —</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={barrel?.status ?? "EMPTY"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{barrel ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
