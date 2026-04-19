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
import { upsertTemplate } from "@/server/actions/quality";

type Template = {
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
  mandatory: boolean;
  holdOnFail: boolean;
  isActive: boolean;
};

type Product = { id: string; sku: string; name: string };

const CHECK_TYPES = ["ABV", "GRAVITY", "PH", "MICROBIAL", "SENSORY", "VISUAL", "TEMPERATURE", "VOLUME"];
const REF_TYPES = ["BREW", "DISTILLATION", "AGING", "BOTTLING", "GRN"];
const CLASSES = ["", "BEER", "SPIRIT", "WINE", "NON_ALC"];

export function TemplateDialog({ template, products }: { template?: Template; products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertTemplate, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(template ? "Template updated" : "Template created");
      setOpen(false);
    }
  }, [state, template]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {template
          ? <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
          : <Button><Plus className="size-4" /> New template</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit" : "New"} check template</DialogTitle>
          <DialogDescription>Reusable check specification.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {template && <input type="hidden" name="id" value={template.id} />}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={template?.name} required placeholder="Lager MASH pH" />
            <FormError state={state} field="name" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="refType">Ref type *</Label>
              <Select name="refType" defaultValue={template?.refType ?? "BREW"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REF_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Input id="stage" name="stage" defaultValue={template?.stage ?? ""} placeholder="MASH, HEARTS" />
            </div>
            <div>
              <Label htmlFor="checkType">Check type *</Label>
              <Select name="checkType" defaultValue={template?.checkType ?? "PH"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHECK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productClass">Product class</Label>
              <Select name="productClass" defaultValue={template?.productClass ?? ""}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => <SelectItem key={c || "any"} value={c}>{c || "— any —"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="productId">Specific product</Label>
              <Select name="productId" defaultValue={template?.productId ?? ""}>
                <SelectTrigger><SelectValue placeholder="— any —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— any —</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="minSpec">Min</Label>
              <Input id="minSpec" name="minSpec" type="number" step="0.001" defaultValue={template?.minSpec ?? ""} />
            </div>
            <div>
              <Label htmlFor="maxSpec">Max</Label>
              <Input id="maxSpec" name="maxSpec" type="number" step="0.001" defaultValue={template?.maxSpec ?? ""} />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" defaultValue={template?.unit ?? ""} placeholder="%, pH" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="mandatory" defaultChecked={template?.mandatory ?? true} /> Mandatory
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="holdOnFail" defaultChecked={template?.holdOnFail ?? true} /> Hold batch on fail
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive" defaultChecked={template?.isActive ?? true} /> Active
            </label>
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{template ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
