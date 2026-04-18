"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
import { upsertTransfer } from "@/server/actions/inventory";

type Warehouse = { id: string; name: string; code: string };

export function TransferDialog({ warehouses }: { warehouses: Warehouse[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertTransfer, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Transfer created");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> New transfer</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New stock transfer</DialogTitle>
          <DialogDescription>Move stock between warehouses.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fromWarehouseId">From warehouse *</Label>
              <Select name="fromWarehouseId">
                <SelectTrigger id="fromWarehouseId">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError state={state} field="fromWarehouseId" />
            </div>
            <div>
              <Label htmlFor="toWarehouseId">To warehouse *</Label>
              <Select name="toWarehouseId">
                <SelectTrigger id="toWarehouseId">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError state={state} field="toWarehouseId" />
            </div>
          </div>
          <div>
            <Label htmlFor="transferredAt">Transfer date (optional)</Label>
            <Input id="transferredAt" name="transferredAt" type="date" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Create</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
