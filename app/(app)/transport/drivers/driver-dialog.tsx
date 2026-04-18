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
import { upsertDriver } from "@/server/actions/transport";

type Driver = {
  id: string;
  ownerCompanyId: string;
  fullName: string;
  phone: string | null;
  nationalId: string | null;
  licenseNumber: string;
  licenseClass: string | null;
  licenseExpiry: Date | null;
  dateHired: Date | null;
  status: string;
  notes: string | null;
};

function toDateInput(d?: Date | null) {
  if (!d) return "";
  const dd = d instanceof Date ? d : new Date(d);
  return dd.toISOString().slice(0, 10);
}

export function DriverDialog({
  driver, companies, defaultCompanyId,
}: {
  driver?: Driver;
  companies: { id: string; name: string }[];
  defaultCompanyId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertDriver, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(driver ? "Driver updated" : "Driver created");
      setOpen(false);
    }
  }, [state, driver]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {driver ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New driver</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{driver ? "Edit driver" : "New driver"}</DialogTitle>
          <DialogDescription>License, employer and contact info.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {driver && <input type="hidden" name="id" value={driver.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ownerCompanyId">Company *</Label>
              <Select name="ownerCompanyId" defaultValue={driver?.ownerCompanyId ?? defaultCompanyId ?? ""}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormError state={state} field="ownerCompanyId" />
            </div>
            <div>
              <Label htmlFor="fullName">Full name *</Label>
              <Input id="fullName" name="fullName" defaultValue={driver?.fullName} required />
              <FormError state={state} field="fullName" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" defaultValue={driver?.phone ?? ""} /></div>
            <div><Label htmlFor="nationalId">National ID</Label><Input id="nationalId" name="nationalId" defaultValue={driver?.nationalId ?? ""} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><Label htmlFor="licenseNumber">License no. *</Label><Input id="licenseNumber" name="licenseNumber" defaultValue={driver?.licenseNumber} required /></div>
            <div><Label htmlFor="licenseClass">Class</Label><Input id="licenseClass" name="licenseClass" defaultValue={driver?.licenseClass ?? ""} /></div>
            <div><Label htmlFor="licenseExpiry">License expiry</Label><Input id="licenseExpiry" name="licenseExpiry" type="date" defaultValue={toDateInput(driver?.licenseExpiry)} /></div>
            <div><Label htmlFor="dateHired">Hired on</Label><Input id="dateHired" name="dateHired" type="date" defaultValue={toDateInput(driver?.dateHired)} /></div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={driver?.status ?? "ACTIVE"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={driver?.notes ?? ""} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{driver ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
