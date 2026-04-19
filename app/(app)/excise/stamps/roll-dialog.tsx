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
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { upsertStampRoll } from "@/server/actions/excise";

type Roll = {
  id: string;
  rollNumber: string;
  stampType: string;
  serialFrom: string;
  serialTo: string;
  quantity: number;
  issuedAt: Date | number | string | null;
  receivedAt: Date | number | string | null;
  warehouseId: string | null;
  notes: string | null;
};

type Warehouse = { id: string; name: string; code: string };

const iso = (d: Date | number | string | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

export function RollDialog({ roll, warehouses }: { roll?: Roll; warehouses: Warehouse[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertStampRoll, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(roll ? "Roll updated" : "Roll recorded");
      setOpen(false);
    }
  }, [state, roll]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {roll
          ? <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
          : <Button><Plus className="size-4" /> New roll</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{roll ? "Edit" : "New"} stamp roll</DialogTitle>
          <DialogDescription>Record a stamp roll received from TRA.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {roll && <input type="hidden" name="id" value={roll.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rollNumber">Roll # *</Label>
              <Input id="rollNumber" name="rollNumber" defaultValue={roll?.rollNumber} required />
              <FormError state={state} field="rollNumber" />
            </div>
            <div>
              <Label htmlFor="stampType">Type *</Label>
              <Select name="stampType" defaultValue={roll?.stampType ?? "BEER"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEER">Beer</SelectItem>
                  <SelectItem value="SPIRIT">Spirit</SelectItem>
                  <SelectItem value="WINE">Wine</SelectItem>
                  <SelectItem value="SOFT_DRINK">Soft drink</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="serialFrom">Serial from *</Label>
              <Input id="serialFrom" name="serialFrom" defaultValue={roll?.serialFrom} required />
            </div>
            <div>
              <Label htmlFor="serialTo">Serial to *</Label>
              <Input id="serialTo" name="serialTo" defaultValue={roll?.serialTo} required />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" name="quantity" type="number" min="1" defaultValue={roll?.quantity} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issuedAt">TRA issued</Label>
              <Input id="issuedAt" name="issuedAt" type="date" defaultValue={iso(roll?.issuedAt)} />
            </div>
            <div>
              <Label htmlFor="receivedAt">Received</Label>
              <Input id="receivedAt" name="receivedAt" type="date" defaultValue={iso(roll?.receivedAt)} />
            </div>
          </div>
          <div>
            <Label htmlFor="warehouseId">Warehouse</Label>
            <Select name="warehouseId" defaultValue={roll?.warehouseId ?? ""}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— none —</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={roll?.notes ?? ""} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{roll ? "Save" : "Record"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
