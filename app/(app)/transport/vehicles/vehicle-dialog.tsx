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
import { upsertVehicle } from "@/server/actions/transport";

type Vehicle = {
  id: string;
  ownerCompanyId: string;
  registrationNumber: string;
  make: string;
  model: string | null;
  year: number | null;
  type: string;
  category: string | null;
  fuelType: string;
  tankCapacityLitres: number | null;
  payloadCapacityKg: number | null;
  currentOdometer: number;
  status: string;
  notes: string | null;
  isActive: boolean;
};

export function VehicleDialog({
  vehicle, companies, defaultCompanyId,
}: {
  vehicle?: Vehicle;
  companies: { id: string; name: string }[];
  defaultCompanyId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertVehicle, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(vehicle ? "Vehicle updated" : "Vehicle created");
      setOpen(false);
    }
  }, [state, vehicle]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {vehicle ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New vehicle</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit vehicle" : "New vehicle"}</DialogTitle>
          <DialogDescription>Fleet asset owned by one of the group companies.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {vehicle && <input type="hidden" name="id" value={vehicle.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ownerCompanyId">Owner company *</Label>
              <Select name="ownerCompanyId" defaultValue={vehicle?.ownerCompanyId ?? defaultCompanyId ?? ""}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormError state={state} field="ownerCompanyId" />
            </div>
            <div>
              <Label htmlFor="registrationNumber">Registration no. *</Label>
              <Input id="registrationNumber" name="registrationNumber" defaultValue={vehicle?.registrationNumber} required />
              <FormError state={state} field="registrationNumber" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><Label htmlFor="make">Make *</Label><Input id="make" name="make" defaultValue={vehicle?.make} required /></div>
            <div><Label htmlFor="model">Model</Label><Input id="model" name="model" defaultValue={vehicle?.model ?? ""} /></div>
            <div><Label htmlFor="year">Year</Label><Input id="year" name="year" type="number" defaultValue={vehicle?.year ?? ""} /></div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={vehicle?.type ?? "TRUCK"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRUCK">Truck</SelectItem>
                  <SelectItem value="VAN">Van</SelectItem>
                  <SelectItem value="PICKUP">Pickup</SelectItem>
                  <SelectItem value="CAR">Car</SelectItem>
                  <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                  <SelectItem value="FORKLIFT">Forklift</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="fuelType">Fuel</Label>
              <Select name="fuelType" defaultValue={vehicle?.fuelType ?? "DIESEL"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                  <SelectItem value="PETROL">Petrol</SelectItem>
                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="tankCapacityLitres">Tank (L)</Label><Input id="tankCapacityLitres" name="tankCapacityLitres" type="number" step="0.1" defaultValue={vehicle?.tankCapacityLitres ?? ""} /></div>
            <div><Label htmlFor="payloadCapacityKg">Payload (kg)</Label><Input id="payloadCapacityKg" name="payloadCapacityKg" type="number" step="0.1" defaultValue={vehicle?.payloadCapacityKg ?? ""} /></div>
            <div><Label htmlFor="currentOdometer">Odometer (km)</Label><Input id="currentOdometer" name="currentOdometer" type="number" step="0.1" defaultValue={vehicle?.currentOdometer ?? 0} /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={vehicle?.status ?? "ACTIVE"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="IDLE">Idle</SelectItem>
                  <SelectItem value="IN_MAINTENANCE">In maintenance</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="category">Category</Label><Input id="category" name="category" defaultValue={vehicle?.category ?? ""} placeholder="Delivery, Executive..." /></div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={vehicle?.notes ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={vehicle?.isActive ?? true} />
            Active
          </label>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{vehicle ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
