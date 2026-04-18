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
import { upsertTransferLine } from "@/server/actions/inventory";

type Product = { id: string; sku: string; name: string; uom: string };

export function TransferLineDialog({
  transferId,
  products,
}: {
  transferId: string;
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertTransferLine, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Line added");
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> Add line</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add transfer line</DialogTitle>
          <DialogDescription>Add a product line to this transfer.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="transferId" value={transferId} />
          <div>
            <Label htmlFor="productId">Product *</Label>
            <Select name="productId">
              <SelectTrigger id="productId">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    <span className="ml-1 text-xs text-muted-foreground font-mono">
                      ({p.sku})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError state={state} field="productId" />
          </div>
          <div>
            <Label htmlFor="batchId">Lot / Batch ID (optional)</Label>
            <Input
              id="batchId"
              name="batchId"
              placeholder="Leave blank for no specific batch"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qty">Quantity *</Label>
              <Input id="qty" name="qty" type="number" step="0.001" min="0.001" required />
              <FormError state={state} field="qty" />
            </div>
            <div>
              <Label htmlFor="unitCost">Unit Cost (TZS)</Label>
              <Input id="unitCost" name="unitCost" type="number" step="1" min="0" defaultValue="0" />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Add line</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
