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
import { upsertMaintenance } from "@/server/actions/transport";

type Maintenance = {
  id: string;
  ownerCompanyId: string;
  vehicleId: string;
  type: string;
  scheduledFor: Date | null;
  performedAt: Date | null;
  odometerAt: number | null;
  description: string;
  workshop: string | null;
  mechanic: string | null;
  partsCost: number;
  labourCost: number;
  nextServiceOdometer: number | null;
  nextServiceDate: Date | null;
  status: string;
  notes: string | null;
};

function toDateInput(d?: Date | null) {
  if (!d) return "";
  const dd = d instanceof Date ? d : new Date(d);
  return dd.toISOString().slice(0, 10);
}

export function MaintenanceDialog({
  record, vehicles, companies, defaultCompanyId,
}: {
  record?: Maintenance;
  vehicles: { id: string; registrationNumber: string; ownerCompanyId: string }[];
  companies: { id: string; name: string }[];
  defaultCompanyId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertMaintenance, null);
  const [companyId, setCompanyId] = useState(record?.ownerCompanyId ?? defaultCompanyId ?? "");

  useEffect(() => {
    if (state?.ok) {
      toast.success(record ? "Maintenance updated" : "Maintenance recorded");
      setOpen(false);
    }
  }, [state, record]);

  const filteredVehicles = companyId ? vehicles.filter((v) => v.ownerCompanyId === companyId) : vehicles;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {record ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New service</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record ? "Edit service" : "Record maintenance"}</DialogTitle>
          <DialogDescription>Routine service, repair, inspection or tyre work.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {record && <input type="hidden" name="id" value={record.id} />}
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
              <Select name="vehicleId" defaultValue={record?.vehicleId ?? ""}>
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
              <Label htmlFor="type">Type *</Label>
              <Select name="type" defaultValue={record?.type ?? "ROUTINE"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Routine service</SelectItem>
                  <SelectItem value="REPAIR">Repair</SelectItem>
                  <SelectItem value="INSPECTION">Inspection</SelectItem>
                  <SelectItem value="TYRE">Tyre</SelectItem>
                  <SelectItem value="BODY">Body / Paint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue={record?.status ?? "PLANNED"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={record?.description ?? ""} required />
            <FormError state={state} field="description" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="scheduledFor">Scheduled for</Label>
              <Input id="scheduledFor" name="scheduledFor" type="date" defaultValue={toDateInput(record?.scheduledFor)} />
            </div>
            <div>
              <Label htmlFor="performedAt">Performed on</Label>
              <Input id="performedAt" name="performedAt" type="date" defaultValue={toDateInput(record?.performedAt)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="odometerAt">Odometer</Label>
              <Input id="odometerAt" name="odometerAt" type="number" step="0.1" defaultValue={record?.odometerAt ?? ""} />
            </div>
            <div>
              <Label htmlFor="workshop">Workshop</Label>
              <Input id="workshop" name="workshop" defaultValue={record?.workshop ?? ""} />
            </div>
            <div>
              <Label htmlFor="mechanic">Mechanic</Label>
              <Input id="mechanic" name="mechanic" defaultValue={record?.mechanic ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="partsCost">Parts cost</Label>
              <Input id="partsCost" name="partsCost" type="number" step="0.01" defaultValue={record?.partsCost ?? 0} />
            </div>
            <div>
              <Label htmlFor="labourCost">Labour cost</Label>
              <Input id="labourCost" name="labourCost" type="number" step="0.01" defaultValue={record?.labourCost ?? 0} />
            </div>
            <div>
              <Label htmlFor="nextServiceOdometer">Next svc (km)</Label>
              <Input id="nextServiceOdometer" name="nextServiceOdometer" type="number" step="0.1" defaultValue={record?.nextServiceOdometer ?? ""} />
            </div>
            <div>
              <Label htmlFor="nextServiceDate">Next svc date</Label>
              <Input id="nextServiceDate" name="nextServiceDate" type="date" defaultValue={toDateInput(record?.nextServiceDate)} />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={record?.notes ?? ""} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{record ? "Save" : "Record"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
