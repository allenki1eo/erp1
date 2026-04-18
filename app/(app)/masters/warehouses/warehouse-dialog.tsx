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
import { upsertWarehouse } from "@/server/actions/warehouses";

type Warehouse = {
  id: string;
  code: string;
  name: string;
  type: string;
  address: string | null;
  isActive: boolean;
};

export function WarehouseDialog({ warehouse }: { warehouse?: Warehouse }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertWarehouse, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(warehouse ? "Warehouse updated" : "Warehouse created");
      setOpen(false);
    }
  }, [state, warehouse]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {warehouse ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New warehouse</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{warehouse ? "Edit warehouse" : "New warehouse"}</DialogTitle>
          <DialogDescription>Storage location within this company.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {warehouse && <input type="hidden" name="id" value={warehouse.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input id="code" name="code" defaultValue={warehouse?.code} required />
              <FormError state={state} field="code" />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={warehouse?.type ?? "MAIN"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN">Main</SelectItem>
                  <SelectItem value="BONDED">Bonded</SelectItem>
                  <SelectItem value="TRANSIT">Transit</SelectItem>
                  <SelectItem value="RETAIL">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={warehouse?.name} required />
            <FormError state={state} field="name" />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" defaultValue={warehouse?.address ?? ""} rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={warehouse?.isActive ?? true} />
            Active
          </label>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{warehouse ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
