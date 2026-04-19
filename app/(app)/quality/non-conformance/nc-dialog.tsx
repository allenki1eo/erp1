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
import { upsertNonConformance } from "@/server/actions/quality";

type Nc = {
  id: string;
  refType: string | null;
  refId: string | null;
  batchId: string | null;
  severity: string;
  description: string;
  rootCause: string | null;
  correctiveAction: string | null;
  disposition: string | null;
  status: string;
};

const REF_TYPES = ["", "BREW", "DISTILLATION", "AGING", "BOTTLING", "GRN"];
const DISPOSITIONS = ["", "REWORK", "SCRAP", "USE_AS_IS", "RETURN", "DOWNGRADE"];

export function NcDialog({ nc }: { nc?: Nc }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertNonConformance, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(nc ? "NCR updated" : "NCR raised");
      setOpen(false);
    }
  }, [state, nc]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {nc
          ? <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
          : <Button><Plus className="size-4" /> New NCR</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{nc ? "Edit" : "Raise"} non-conformance</DialogTitle>
          <DialogDescription>Root cause analysis & corrective action tracking.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {nc && <input type="hidden" name="id" value={nc.id} />}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="refType">Ref type</Label>
              <Select name="refType" defaultValue={nc?.refType ?? ""}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {REF_TYPES.map((t) => <SelectItem key={t || "none"} value={t}>{t || "— none —"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="refId">Ref ID</Label>
              <Input id="refId" name="refId" defaultValue={nc?.refId ?? ""} placeholder="uuid" />
            </div>
            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select name="severity" defaultValue={nc?.severity ?? "MINOR"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MINOR">Minor</SelectItem>
                  <SelectItem value="MAJOR">Major</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="batchId">Batch ID (optional)</Label>
            <Input id="batchId" name="batchId" defaultValue={nc?.batchId ?? ""} placeholder="stock_batch UUID" />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={nc?.description ?? ""} required />
            <FormError state={state} field="description" />
          </div>
          <div>
            <Label htmlFor="rootCause">Root cause</Label>
            <Textarea id="rootCause" name="rootCause" rows={2} defaultValue={nc?.rootCause ?? ""} />
          </div>
          <div>
            <Label htmlFor="correctiveAction">Corrective action</Label>
            <Textarea id="correctiveAction" name="correctiveAction" rows={2} defaultValue={nc?.correctiveAction ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="disposition">Disposition</Label>
              <Select name="disposition" defaultValue={nc?.disposition ?? ""}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {DISPOSITIONS.map((d) => <SelectItem key={d || "none"} value={d}>{d || "— none —"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue={nc?.status ?? "OPEN"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_REVIEW">In review</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{nc ? "Save" : "Raise NCR"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
