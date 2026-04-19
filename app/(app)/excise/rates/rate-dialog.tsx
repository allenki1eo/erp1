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
import { upsertExciseRate } from "@/server/actions/excise";

type Rate = {
  id: string;
  productClass: string;
  ratePerLitre: number | null;
  ratePerLitreOfAlcohol: number | null;
  effectiveFrom: Date | number | string;
};

export function RateDialog({ rate }: { rate?: Rate }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertExciseRate, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(rate ? "Rate updated" : "Rate added");
      setOpen(false);
    }
  }, [state, rate]);

  const toIsoDate = (d: Date | number | string | undefined) => {
    if (!d) return new Date().toISOString().slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {rate
          ? <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
          : <Button><Plus className="size-4" /> New rate</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{rate ? "Edit" : "New"} excise rate</DialogTitle>
          <DialogDescription>Enter either rate/litre OR rate/LoA, depending on how the class is taxed.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {rate && <input type="hidden" name="id" value={rate.id} />}
          <div>
            <Label htmlFor="productClass">Product class *</Label>
            <Select name="productClass" defaultValue={rate?.productClass ?? "BEER"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BEER">Beer</SelectItem>
                <SelectItem value="SPIRIT">Spirit</SelectItem>
                <SelectItem value="WINE">Wine</SelectItem>
                <SelectItem value="NON_ALC">Non-alcoholic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ratePerLitre">Rate per litre (TZS)</Label>
            <Input id="ratePerLitre" name="ratePerLitre" type="number" step="0.01" defaultValue={rate?.ratePerLitre ?? ""} />
          </div>
          <div>
            <Label htmlFor="ratePerLitreOfAlcohol">Rate per litre of alcohol (TZS)</Label>
            <Input id="ratePerLitreOfAlcohol" name="ratePerLitreOfAlcohol" type="number" step="0.01" defaultValue={rate?.ratePerLitreOfAlcohol ?? ""} />
          </div>
          <div>
            <Label htmlFor="effectiveFrom">Effective from *</Label>
            <Input id="effectiveFrom" name="effectiveFrom" type="date" defaultValue={toIsoDate(rate?.effectiveFrom)} required />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{rate ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
