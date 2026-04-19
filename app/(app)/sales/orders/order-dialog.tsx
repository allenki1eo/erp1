"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { createOrder } from "@/server/actions/sales";

type Opt = { id: string; code?: string; name: string };

export function OrderDialog({
  customers, warehouses, routes,
}: {
  customers: Opt[];
  warehouses: Opt[];
  routes: Opt[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createOrder, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.data && typeof state.data === "object" && "id" in state.data) {
      toast.success("Order created");
      setOpen(false);
      router.push(`/sales/orders/${(state.data as { id: string }).id}`);
    }
  }, [state, router]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> New order</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New sales order</DialogTitle>
          <DialogDescription>Lines can be added from the order page.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div>
            <Label htmlFor="customerId">Customer *</Label>
            <select
              id="customerId"
              name="customerId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ""}{c.name}</option>
              ))}
            </select>
            <FormError state={state} field="customerId" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderDate">Order date *</Label>
              <Input id="orderDate" name="orderDate" type="date" defaultValue={today} required />
            </div>
            <div>
              <Label htmlFor="deliveryDate">Delivery date</Label>
              <Input id="deliveryDate" name="deliveryDate" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warehouseId">Warehouse</Label>
              <select
                id="warehouseId"
                name="warehouseId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="">—</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="routeId">Route</Label>
              <select
                id="routeId"
                name="routeId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="">—</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Create order</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
