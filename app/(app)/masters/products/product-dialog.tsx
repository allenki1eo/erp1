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
import { upsertProduct } from "@/server/actions/products";

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  type: string;
  productClass: string | null;
  uom: string;
  packSize: number | null;
  unitsPerCase: number | null;
  abv: number | null;
  costPrice: number | null;
  sellingPrice: number | null;
  reorderLevel: number | null;
  isActive: boolean;
};

export function ProductDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertProduct, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(product ? "Product updated" : "Product created");
      setOpen(false);
    }
  }, [state, product]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New product</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>SKU, recipe-ready fields and pricing.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {product && <input type="hidden" name="id" value={product.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" name="sku" defaultValue={product?.sku} required />
              <FormError state={state} field="sku" />
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select name="type" defaultValue={product?.type ?? "FINISHED_GOOD"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RAW_MATERIAL">Raw material</SelectItem>
                  <SelectItem value="PACKAGING">Packaging</SelectItem>
                  <SelectItem value="WIP">Work-in-progress</SelectItem>
                  <SelectItem value="FINISHED_GOOD">Finished good</SelectItem>
                  <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={product?.name} required />
            <FormError state={state} field="name" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={product?.description ?? ""} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="productClass">Class</Label>
              <Select name="productClass" defaultValue={product?.productClass ?? ""}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEER">Beer</SelectItem>
                  <SelectItem value="SPIRIT">Spirit</SelectItem>
                  <SelectItem value="WINE">Wine</SelectItem>
                  <SelectItem value="NON_ALC">Non-alcoholic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="uom">UoM *</Label>
              <Input id="uom" name="uom" defaultValue={product?.uom ?? "PCS"} required />
            </div>
            <div>
              <Label htmlFor="packSize">Pack size (L)</Label>
              <Input id="packSize" name="packSize" type="number" step="0.001" defaultValue={product?.packSize ?? ""} />
            </div>
            <div>
              <Label htmlFor="unitsPerCase">Units / case</Label>
              <Input id="unitsPerCase" name="unitsPerCase" type="number" defaultValue={product?.unitsPerCase ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="abv">ABV (0-1)</Label>
              <Input id="abv" name="abv" type="number" step="0.001" defaultValue={product?.abv ?? ""} placeholder="0.05" />
            </div>
            <div>
              <Label htmlFor="costPrice">Cost (TZS)</Label>
              <Input id="costPrice" name="costPrice" type="number" step="0.01" defaultValue={product?.costPrice ?? 0} />
            </div>
            <div>
              <Label htmlFor="sellingPrice">Price (TZS)</Label>
              <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" defaultValue={product?.sellingPrice ?? 0} />
            </div>
            <div>
              <Label htmlFor="reorderLevel">Reorder level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" step="0.01" defaultValue={product?.reorderLevel ?? 0} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} />
            Active
          </label>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{product ? "Save" : "Create"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
