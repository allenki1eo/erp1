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
import { upsertStockTake } from "@/server/actions/inventory";

type Warehouse = { id: string; name: string; code: string };

export function StockTakeDialog({ warehouses }: { warehouses: Warehouse[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertStockTake, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Stock take created");
      setOpen(false);
    }
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> New stock take</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New stock take</DialogTitle>
          <DialogDescription>
            Creates a stock take with lines auto-populated from current batch balances.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div>
            <Label htmlFor="warehouseId">Warehouse *</Label>
            <Select name="warehouseId">
              <SelectTrigger id="warehouseId">
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
            <FormError state={state} field="warehouseId" />
          </div>
          <div>
            <Label htmlFor="takenAt">Count date *</Label>
            <Input id="takenAt" name="takenAt" type="date" defaultValue={today} required />
            <FormError state={state} field="takenAt" />
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
