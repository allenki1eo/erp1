"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
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
import { recordCheck } from "@/server/actions/quality";

type Template = {
  tpl: {
    id: string;
    name: string;
    refType: string;
    stage: string | null;
    checkType: string;
    productClass: string | null;
    productId: string | null;
    unit: string | null;
    minSpec: number | null;
    maxSpec: number | null;
  };
};

type Ref = { id: string; label: string };
type RefsByType = Record<string, Ref[]>;

const CHECK_TYPES = ["ABV", "GRAVITY", "PH", "MICROBIAL", "SENSORY", "VISUAL", "TEMPERATURE", "VOLUME"];
const REF_TYPES = ["BREW", "DISTILLATION", "AGING", "BOTTLING", "GRN"];

export function CheckDialog({ templates, refsByType }: { templates: Template[]; refsByType: RefsByType }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(recordCheck, null);
  const [refType, setRefType] = useState("BREW");
  const [templateId, setTemplateId] = useState<string>("__none");

  useEffect(() => {
    if (state?.ok) {
      toast.success("Check recorded");
      setOpen(false);
    }
  }, [state]);

  const currentTemplate = useMemo(
    () => templateId === "__none" ? undefined : templates.find((t) => t.tpl.id === templateId)?.tpl,
    [templates, templateId],
  );

  const relevantTemplates = useMemo(
    () => templates.filter((t) => t.tpl.refType === refType),
    [templates, refType],
  );

  const refs = refsByType[refType] ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><ClipboardCheck className="size-4" /> New check</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record QC check</DialogTitle>
          <DialogDescription>
            Result auto-derives from measurement vs. spec. Choose HOLD to flag for review.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="refType">Reference type *</Label>
              <Select name="refType" value={refType} onValueChange={setRefType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REF_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="refId">Reference *</Label>
              <Select name="refId">
                <SelectTrigger id="refId"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {refs.length === 0 ? (
                    <SelectItem value="__none" disabled>No records</SelectItem>
                  ) : refs.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError state={state} field="refId" />
            </div>
          </div>

          <div>
            <Label htmlFor="templateId">Template (optional)</Label>
            <Select name="templateId" value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="No template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— none —</SelectItem>
                {relevantTemplates.map((t) => (
                  <SelectItem key={t.tpl.id} value={t.tpl.id}>
                    {t.tpl.name} ({t.tpl.checkType}{t.tpl.stage ? ` · ${t.tpl.stage}` : ""})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Input id="stage" name="stage" defaultValue={currentTemplate?.stage ?? ""} placeholder="MASH, HEARTS, PRE_FILL" />
            </div>
            <div>
              <Label htmlFor="checkType">Check type *</Label>
              <Select name="checkType" defaultValue={currentTemplate?.checkType ?? "ABV"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHECK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" defaultValue={currentTemplate?.unit ?? ""} placeholder="%, pH, °C" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="measuredValue">Measured *</Label>
              <Input id="measuredValue" name="measuredValue" type="number" step="0.001" required />
            </div>
            <div>
              <Label htmlFor="minSpec">Min spec</Label>
              <Input id="minSpec" name="minSpec" type="number" step="0.001" defaultValue={currentTemplate?.minSpec ?? ""} />
            </div>
            <div>
              <Label htmlFor="maxSpec">Max spec</Label>
              <Input id="maxSpec" name="maxSpec" type="number" step="0.001" defaultValue={currentTemplate?.maxSpec ?? ""} />
            </div>
          </div>

          <div>
            <Label htmlFor="result">Override result</Label>
            <Select name="result" defaultValue="PASS">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PASS">PASS (auto-derived from spec when min/max set)</SelectItem>
                <SelectItem value="FAIL">FAIL (override)</SelectItem>
                <SelectItem value="HOLD">HOLD (flag for review)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Save check</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
