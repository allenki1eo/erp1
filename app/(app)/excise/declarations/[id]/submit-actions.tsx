"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitDeclaration, markDeclarationPaid } from "@/server/actions/excise";

type Declaration = { id: string; status: string };

export function SubmitActions({ declaration }: { declaration: Declaration }) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [pending, start] = useTransition();

  if (declaration.status === "DRAFT") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm"><Send className="size-4" /> Submit to TRA</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit declaration</DialogTitle>
            <DialogDescription>
              Marks the declaration as submitted. Include the TRA acknowledgement reference if available.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tra">TRA reference</Label>
              <Input id="tra" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="TRA/2024/..." />
            </div>
            <DialogFooter>
              <Button
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await submitDeclaration(declaration.id, ref || undefined);
                    if (res.ok) {
                      toast.success("Submitted");
                      setOpen(false);
                    } else toast.error(res.error);
                  })
                }
              >
                Confirm submit
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (declaration.status === "SUBMITTED") {
    return (
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await markDeclarationPaid(declaration.id);
            if (res.ok) toast.success("Marked paid");
            else toast.error(res.error);
          })
        }
      >
        <CheckCircle2 className="size-4" /> Mark paid
      </Button>
    );
  }

  return null;
}
