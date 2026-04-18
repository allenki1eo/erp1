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
import { upsertVehicleDocument } from "@/server/actions/transport";

type VehicleDoc = {
  id: string;
  vehicleId: string;
  type: string;
  number: string | null;
  issuer: string | null;
  issuedOn: Date | null;
  expiresOn: Date | null;
  fileUrl: string | null;
  cost: number | null;
  notes: string | null;
};

function toDateInput(d?: Date | null) {
  if (!d) return "";
  const dd = d instanceof Date ? d : new Date(d);
  return dd.toISOString().slice(0, 10);
}

export function DocumentDialog({
  doc, vehicles,
}: {
  doc?: VehicleDoc;
  vehicles: { id: string; registrationNumber: string; ownerCompanyId: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertVehicleDocument, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(doc ? "Document updated" : "Document added");
      setOpen(false);
    }
  }, [state, doc]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {doc ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New document</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{doc ? "Edit document" : "New vehicle document"}</DialogTitle>
          <DialogDescription>Insurance, TLB, inspection, fitness or road licence.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {doc && <input type="hidden" name="id" value={doc.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="vehicleId">Vehicle *</Label>
              <Select name="vehicleId" defaultValue={doc?.vehicleId ?? ""}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormError state={state} field="vehicleId" />
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select name="type" defaultValue={doc?.type ?? "INSURANCE"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="TLB">TLB</SelectItem>
                  <SelectItem value="INSPECTION">Inspection</SelectItem>
                  <SelectItem value="FITNESS">Fitness</SelectItem>
                  <SelectItem value="ROAD_LICENSE">Road licence</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="number">Document no.</Label>
              <Input id="number" name="number" defaultValue={doc?.number ?? ""} />
            </div>
            <div>
              <Label htmlFor="issuer">Issuer</Label>
              <Input id="issuer" name="issuer" defaultValue={doc?.issuer ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="issuedOn">Issued on</Label>
              <Input id="issuedOn" name="issuedOn" type="date" defaultValue={toDateInput(doc?.issuedOn)} />
            </div>
            <div>
              <Label htmlFor="expiresOn">Expires on</Label>
              <Input id="expiresOn" name="expiresOn" type="date" defaultValue={toDateInput(doc?.expiresOn)} />
            </div>
            <div>
              <Label htmlFor="cost">Cost (TZS)</Label>
              <Input id="cost" name="cost" type="number" step="0.01" defaultValue={doc?.cost ?? 0} />
            </div>
          </div>
          <div>
            <Label htmlFor="fileUrl">File URL</Label>
            <Input id="fileUrl" name="fileUrl" type="url" defaultValue={doc?.fileUrl ?? ""} placeholder="https://..." />
            <FormError state={state} field="fileUrl" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={doc?.notes ?? ""} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{doc ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
