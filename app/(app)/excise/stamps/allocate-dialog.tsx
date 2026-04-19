"use client";

import { useActionState, useEffect, useState } from "react";
import { Ticket } from "lucide-react";
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
import { allocateStamps } from "@/server/actions/excise";

type Roll = {
  id: string;
  rollNumber: string;
  stampType: string;
  quantity: number;
  usedQty: number;
  wastedQty: number;
  status: string;
};

export function AllocateDialog({ rolls }: { rolls: Roll[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(allocateStamps, null);
  const activeRolls = rolls.filter((r) => r.status !== "EXHAUSTED" && r.status !== "VOID");

  useEffect(() => {
    if (state?.ok) {
      toast.success("Stamps allocated");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Ticket className="size-4" /> Allocate stamps</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Allocate stamps</DialogTitle>
          <DialogDescription>Assign a contiguous serial range from a roll to a bottling run or batch.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div>
            <Label htmlFor="rollId">Roll *</Label>
            <Select name="rollId">
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {activeRolls.length === 0 ? (
                  <SelectItem value="__none" disabled>No active rolls</SelectItem>
                ) : activeRolls.map((r) => {
                  const remaining = r.quantity - r.usedQty - r.wastedQty;
                  return (
                    <SelectItem key={r.id} value={r.id}>
                      {r.rollNumber} ({r.stampType}) — {remaining} remaining
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormError state={state} field="rollId" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="refType">Ref type *</Label>
              <Select name="refType" defaultValue="BOTTLING">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTTLING">Bottling run</SelectItem>
                  <SelectItem value="BATCH">Stock batch</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="refId">Ref ID</Label>
              <Input id="refId" name="refId" placeholder="UUID of run/batch" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="serialFrom">Serial from *</Label>
              <Input id="serialFrom" name="serialFrom" required />
            </div>
            <div>
              <Label htmlFor="serialTo">Serial to *</Label>
              <Input id="serialTo" name="serialTo" required />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" name="quantity" type="number" min="1" required />
            </div>
          </div>
          <div>
            <Label htmlFor="wastedQty">Wasted qty</Label>
            <Input id="wastedQty" name="wastedQty" type="number" min="0" defaultValue="0" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Allocate</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
