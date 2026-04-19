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
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { createDeclaration } from "@/server/actions/excise";

// Compute the previous calendar month as default period.
function defaultPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label,
  };
}

export function DeclarationDialog() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createDeclaration, null);
  const period = defaultPeriod();

  useEffect(() => {
    if (state?.ok) {
      toast.success("Declaration created");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> New declaration</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New excise declaration</DialogTitle>
          <DialogDescription>
            Aggregates all duty-paid bonded removals in the period not yet assigned to a declaration.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div>
            <Label htmlFor="periodLabel">Period label *</Label>
            <Input id="periodLabel" name="periodLabel" defaultValue={period.label} placeholder="2024-04" required />
            <FormError state={state} field="periodLabel" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodStart">From *</Label>
              <Input id="periodStart" name="periodStart" type="date" defaultValue={period.start} required />
            </div>
            <div>
              <Label htmlFor="periodEnd">To *</Label>
              <Input id="periodEnd" name="periodEnd" type="date" defaultValue={period.end} required />
            </div>
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
