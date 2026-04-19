"use client";

import { useActionState, useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";
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
import { logVisit } from "@/server/actions/sales";

type Opt = { id: string; code?: string; name: string };

export function VisitDialog({ customers }: { customers: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(logVisit, null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Visit logged");
      setOpen(false);
      setCoords(null);
    }
  }, [state]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not available");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        toast.error("Could not get location");
        setLocating(false);
      },
    );
  };

  const now = new Date();
  const defaultDt = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> Log visit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log customer visit</DialogTitle>
          <DialogDescription>Capture outcome and optional GPS.</DialogDescription>
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
              <Label htmlFor="visitedAt">When *</Label>
              <Input id="visitedAt" name="visitedAt" type="datetime-local" defaultValue={defaultDt} required />
            </div>
            <div>
              <Label htmlFor="outcome">Outcome *</Label>
              <select
                id="outcome"
                name="outcome"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="ORDER">Order placed</option>
                <option value="NO_ORDER">No order</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="COMPLAINT">Complaint</option>
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Location</Label>
              <Button type="button" variant="outline" size="sm" onClick={captureLocation} disabled={locating}>
                <MapPin className="size-3" />
                {locating ? "Locating…" : coords ? "Update" : "Capture GPS"}
              </Button>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              {coords ? `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}` : "No location captured"}
            </div>
            <input type="hidden" name="latitude" value={coords?.lat ?? ""} />
            <input type="hidden" name="longitude" value={coords?.lon ?? ""} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Discussion, next steps…" />
          </div>
          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>Log visit</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
