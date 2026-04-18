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
import { upsertSpare } from "@/server/actions/transport";

type Spare = {
  id: string;
  ownerCompanyId: string;
  partNumber: string;
  name: string;
  description: string | null;
  category: string | null;
  uom: string;
  unitCost: number;
  qtyOnHand: number;
  reorderLevel: number;
  isActive: boolean;
};

export function SpareDialog({
  spare, companies, defaultCompanyId,
}: {
  spare?: Spare;
  companies: { id: string; name: string }[];
  defaultCompanyId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertSpare, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(spare ? "Spare updated" : "Spare created");
      setOpen(false);
    }
  }, [state, spare]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {spare ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New spare</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{spare ? "Edit spare part" : "New spare part"}</DialogTitle>
          <DialogDescription>Parts inventory for workshop repairs.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {spare && <input type="hidden" name="id" value={spare.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ownerCompanyId">Company *</Label>
              <Select name="ownerCompanyId" defaultValue={spare?.ownerCompanyId ?? defaultCompanyId ?? ""}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="partNumber">Part number *</Label>
              <Input id="partNumber" name="partNumber" defaultValue={spare?.partNumber} required />
              <FormError state={state} field="partNumber" />
            </div>
          </div>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={spare?.name} required />
            <FormError state={state} field="name" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={spare?.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={spare?.category ?? ""}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FILTER">Filter</SelectItem>
                  <SelectItem value="OIL">Oil</SelectItem>
                  <SelectItem value="TYRE">Tyre</SelectItem>
                  <SelectItem value="BRAKE">Brake</SelectItem>
                  <SelectItem value="BATTERY">Battery</SelectItem>
                  <SelectItem value="FLUID">Fluid</SelectItem>
                  <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="uom">UoM *</Label>
              <Input id="uom" name="uom" defaultValue={spare?.uom ?? "PCS"} required />
            </div>
            <div>
              <Label htmlFor="unitCost">Unit cost</Label>
              <Input id="unitCost" name="unitCost" type="number" step="0.01" defaultValue={spare?.unitCost ?? 0} />
            </div>
            <div>
              <Label htmlFor="qtyOnHand">Qty on hand</Label>
              <Input id="qtyOnHand" name="qtyOnHand" type="number" step="0.01" defaultValue={spare?.qtyOnHand ?? 0} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="reorderLevel">Reorder level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" step="0.01" defaultValue={spare?.reorderLevel ?? 0} />
            </div>
            <div>
              <Label className="invisible">Active</Label>
              <label className="flex h-9 items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={spare?.isActive ?? true} />
                Active
              </label>
            </div>
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{spare ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
