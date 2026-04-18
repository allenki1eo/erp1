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
import { upsertFuelLog } from "@/server/actions/transport";

type FuelLog = {
  id: string;
  ownerCompanyId: string;
  vehicleId: string;
  driverId: string | null;
  filledAt: Date;
  station: string | null;
  litres: number;
  pricePerLitre: number;
  odometer: number;
  isFullTank: boolean;
  receiptNumber: string | null;
  notes: string | null;
};

function toDateInput(d?: Date | null) {
  if (!d) return "";
  const dd = d instanceof Date ? d : new Date(d);
  return dd.toISOString().slice(0, 16);
}

export function FuelDialog({
  log, vehicles, drivers, companies, defaultCompanyId,
}: {
  log?: FuelLog;
  vehicles: { id: string; registrationNumber: string; ownerCompanyId: string }[];
  drivers: { id: string; fullName: string; ownerCompanyId: string }[];
  companies: { id: string; name: string }[];
  defaultCompanyId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertFuelLog, null);
  const [companyId, setCompanyId] = useState(log?.ownerCompanyId ?? defaultCompanyId ?? "");

  useEffect(() => {
    if (state?.ok) {
      toast.success(log ? "Fuel log updated" : "Fuel log created");
      setOpen(false);
    }
  }, [state, log]);

  const filteredVehicles = companyId ? vehicles.filter((v) => v.ownerCompanyId === companyId) : vehicles;
  const filteredDrivers = companyId ? drivers.filter((d) => d.ownerCompanyId === companyId) : drivers;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {log ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> Log fuel</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{log ? "Edit fuel entry" : "Record fuel"}</DialogTitle>
          <DialogDescription>Total cost is calculated automatically.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {log && <input type="hidden" name="id" value={log.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ownerCompanyId">Company *</Label>
              <Select name="ownerCompanyId" value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vehicleId">Vehicle *</Label>
              <Select name="vehicleId" defaultValue={log?.vehicleId ?? ""}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {filteredVehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormError state={state} field="vehicleId" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="driverId">Driver</Label>
              <Select name="driverId" defaultValue={log?.driverId ?? ""}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {filteredDrivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filledAt">Filled at *</Label>
              <Input id="filledAt" name="filledAt" type="datetime-local" defaultValue={toDateInput(log?.filledAt) || new Date().toISOString().slice(0, 16)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><Label htmlFor="litres">Litres *</Label><Input id="litres" name="litres" type="number" step="0.01" defaultValue={log?.litres ?? ""} required /></div>
            <div><Label htmlFor="pricePerLitre">Price / L *</Label><Input id="pricePerLitre" name="pricePerLitre" type="number" step="0.01" defaultValue={log?.pricePerLitre ?? ""} required /></div>
            <div><Label htmlFor="odometer">Odometer *</Label><Input id="odometer" name="odometer" type="number" step="0.1" defaultValue={log?.odometer ?? ""} required /></div>
            <div>
              <Label className="invisible">Full</Label>
              <label className="flex h-9 items-center gap-2 text-sm">
                <input type="checkbox" name="isFullTank" defaultChecked={log?.isFullTank ?? true} />
                Full tank
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label htmlFor="station">Station</Label><Input id="station" name="station" defaultValue={log?.station ?? ""} /></div>
            <div><Label htmlFor="receiptNumber">Receipt no.</Label><Input id="receiptNumber" name="receiptNumber" defaultValue={log?.receiptNumber ?? ""} /></div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={log?.notes ?? ""} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{log ? "Save" : "Record"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
