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
import { upsertSupplierInvoice } from "@/server/actions/procurement";

type Invoice = {
  id: string;
  supplierId: string;
  poId: string | null;
  grnId: string | null;
  supplierInvoiceNumber: string | null;
  invoiceDate: Date;
  dueDate: Date | null;
  notes: string | null;
};

function toDateInput(d?: Date | null) {
  if (!d) return "";
  const dd = d instanceof Date ? d : new Date(d);
  return dd.toISOString().slice(0, 10);
}

export function SupplierInvoiceDialog({
  invoice,
  suppliers,
  pos,
  grns,
}: {
  invoice?: Invoice;
  suppliers: { id: string; name: string; code: string }[];
  pos: { id: string; number: string }[];
  grns: { id: string; number: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertSupplierInvoice, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(invoice ? "Invoice updated" : "Invoice created");
      setOpen(false);
    }
  }, [state, invoice]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {invoice ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New invoice</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit supplier invoice" : "New supplier invoice"}</DialogTitle>
          <DialogDescription>Supplier invoice reference and payment tracking.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {invoice && <input type="hidden" name="id" value={invoice.id} />}
          <div>
            <Label>Supplier *</Label>
            <Select name="supplierId" defaultValue={invoice?.supplierId ?? ""}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormError state={state} field="supplierId" />
          </div>
          <div>
            <Label htmlFor="supplierInvoiceNumber">Supplier invoice no.</Label>
            <Input id="supplierInvoiceNumber" name="supplierInvoiceNumber" defaultValue={invoice?.supplierInvoiceNumber ?? ""} placeholder="e.g. INV-2024-001" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="invoiceDate">Invoice date *</Label>
              <Input id="invoiceDate" name="invoiceDate" type="date" defaultValue={toDateInput(invoice?.invoiceDate) || new Date().toISOString().slice(0, 10)} required />
            </div>
            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={toDateInput(invoice?.dueDate)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Linked PO</Label>
              <Select name="poId" defaultValue={invoice?.poId ?? ""}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {pos.map((p) => <SelectItem key={p.id} value={p.id}>{p.number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Linked GRN</Label>
              <Select name="grnId" defaultValue={invoice?.grnId ?? ""}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {grns.map((g) => <SelectItem key={g.id} value={g.id}>{g.number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={invoice?.notes ?? ""} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{invoice ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
