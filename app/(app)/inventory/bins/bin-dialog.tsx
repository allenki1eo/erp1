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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { upsertBinLocation } from "@/server/actions/inventory";

type Bin = { id: string; warehouseId: string; code: string; name: string | null; zone: string | null; isActive: boolean };

export function BinDialog({
  bin, warehouses,
}: {
  bin?: Bin;
  warehouses: { id: string; name: string; code: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertBinLocation, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(bin ? "Bin updated" : "Bin created");
      setOpen(false);
    }
  }, [state, bin]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {bin ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New bin</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bin ? "Edit bin location" : "New bin location"}</DialogTitle>
          <DialogDescription>Rack / bin / zone within a warehouse.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {bin && <input type="hidden" name="id" value={bin.id} />}
          <div>
            <Label>Warehouse *</Label>
            <Select name="warehouseId" defaultValue={bin?.warehouseId ?? ""}>
              <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.code} — {w.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormError state={state} field="warehouseId" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input id="code" name="code" defaultValue={bin?.code} placeholder="A-01-03" required />
              <FormError state={state} field="code" />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={bin?.name ?? ""} />
            </div>
          </div>
          <div>
            <Label>Zone</Label>
            <Select name="zone" defaultValue={bin?.zone ?? ""}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RECEIVING">Receiving</SelectItem>
                <SelectItem value="STORAGE">Storage</SelectItem>
                <SelectItem value="COLD">Cold store</SelectItem>
                <SelectItem value="DISPATCH">Dispatch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={bin?.isActive ?? true} />
            Active
          </label>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{bin ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
