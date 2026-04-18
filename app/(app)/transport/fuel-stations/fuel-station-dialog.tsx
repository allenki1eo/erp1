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
import { upsertFuelStation } from "@/server/actions/transport";

type FuelStation = {
  id: string;
  ownerCompanyId: string;
  name: string;
  type: string;
  address: string | null;
  fuelType: string;
  tankCapacityLitres: number | null;
  currentVolumeLitres: number;
  isActive: boolean;
};

export function FuelStationDialog({
  station, companies, defaultCompanyId,
}: {
  station?: FuelStation;
  companies: { id: string; name: string }[];
  defaultCompanyId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertFuelStation, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(station ? "Station updated" : "Station created");
      setOpen(false);
    }
  }, [state, station]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {station ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New station</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{station ? "Edit fuel station" : "New fuel station"}</DialogTitle>
          <DialogDescription>Internal = our own on-premises tank. External = third-party station.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {station && <input type="hidden" name="id" value={station.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Company *</Label>
              <Select name="ownerCompanyId" defaultValue={station?.ownerCompanyId ?? defaultCompanyId ?? ""}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type *</Label>
              <Select name="type" defaultValue={station?.type ?? "INTERNAL"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">Internal (our station)</SelectItem>
                  <SelectItem value="EXTERNAL">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={station?.name} required />
            <FormError state={state} field="name" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Fuel type</Label>
              <Select name="fuelType" defaultValue={station?.fuelType ?? "DIESEL"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                  <SelectItem value="PETROL">Petrol</SelectItem>
                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tankCapacityLitres">Tank capacity (L)</Label>
              <Input id="tankCapacityLitres" name="tankCapacityLitres" type="number" step="0.1" defaultValue={station?.tankCapacityLitres ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="currentVolumeLitres">Current volume (L)</Label>
            <Input id="currentVolumeLitres" name="currentVolumeLitres" type="number" step="0.1" defaultValue={station?.currentVolumeLitres ?? 0} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" rows={2} defaultValue={station?.address ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={station?.isActive ?? true} />
            Active
          </label>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{station ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
