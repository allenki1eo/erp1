"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
import { upsertBondedMovement } from "@/server/actions/excise";

type Warehouse = { id: string; name: string; code: string };
type Product = { id: string; sku: string; name: string; productClass: string | null; abv: number | null };

export function BondedDialog({
  bondedWarehouses,
  allWarehouses,
  products,
}: {
  bondedWarehouses: Warehouse[];
  allWarehouses: Warehouse[];
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertBondedMovement, null);
  const [movementType, setMovementType] = useState("ENTRY");

  useEffect(() => {
    if (state?.ok) {
      toast.success("Movement posted");
      setOpen(false);
    }
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);
  const showDestination = movementType === "TRANSFER_BONDED" || movementType === "REMOVAL_DUTY_PAID" || movementType === "REMOVAL_EXPORT";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> New movement</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bonded warehouse movement</DialogTitle>
          <DialogDescription>
            Duty is computed automatically on <b>duty-paid removals</b>, using the active excise rate for the product class.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="movementType">Movement type *</Label>
              <Select name="movementType" value={movementType} onValueChange={setMovementType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRY">Entry (into bond)</SelectItem>
                  <SelectItem value="REMOVAL_DUTY_PAID">Removal — duty paid</SelectItem>
                  <SelectItem value="REMOVAL_EXPORT">Removal — export (no duty)</SelectItem>
                  <SelectItem value="TRANSFER_BONDED">Transfer bonded→bonded</SelectItem>
                  <SelectItem value="LOSS">Approved loss</SelectItem>
                  <SelectItem value="DESTRUCTION">Destruction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="movedAt">Date *</Label>
              <Input id="movedAt" name="movedAt" type="date" defaultValue={today} required />
            </div>
          </div>

          <div>
            <Label htmlFor="productId">Product *</Label>
            <Select name="productId">
              <SelectTrigger><SelectValue placeholder="Select product…" /></SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="__none" disabled>No excisable products</SelectItem>
                ) : products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.sku}) {p.productClass ? `· ${p.productClass}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError state={state} field="productId" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warehouseId">Bonded warehouse *</Label>
              <Select name="warehouseId">
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {bondedWarehouses.length === 0 ? (
                    <SelectItem value="__none" disabled>No bonded warehouses</SelectItem>
                  ) : bondedWarehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError state={state} field="warehouseId" />
            </div>
            {showDestination && (
              <div>
                <Label htmlFor="destinationWarehouseId">Destination</Label>
                <Select name="destinationWarehouseId">
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— none —</SelectItem>
                    {allWarehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="qtyLitres">Litres *</Label>
              <Input id="qtyLitres" name="qtyLitres" type="number" step="0.01" min="0.01" required />
            </div>
            <div>
              <Label htmlFor="abv">ABV (0–1)</Label>
              <Input id="abv" name="abv" type="number" step="0.001" min="0" max="1" placeholder="0.40" />
            </div>
            <div>
              <Label htmlFor="batchId">Batch ID</Label>
              <Input id="batchId" name="batchId" placeholder="stock_batch UUID" />
            </div>
          </div>

          <div>
            <Label htmlFor="reference">External reference</Label>
            <Input id="reference" name="reference" placeholder="Import declaration / export docket / still run" />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Post movement</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
