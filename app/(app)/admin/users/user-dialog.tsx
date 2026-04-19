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
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { createCompanyUser, updateCompanyUser } from "@/server/actions/admin";

type Role = { id: string; name: string };
type Member = {
  userId: string;
  name: string | null;
  email: string;
  roleId: string | null;
  salesTargetMonthly: number | null;
  isActive: boolean;
};

export function UserDialog({ roles, user }: { roles: Role[]; user?: Member }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!user;
  const [state, action] = useActionState(isEdit ? updateCompanyUser : createCompanyUser, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "User updated" : "User added");
      setOpen(false);
    }
  }, [state, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> Add user</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit access" : "Add user to company"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the role or sales target for this member." : "New users are added to this company with the selected role. If the email already exists, it's linked."}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="userId" value={user.userId} />}

          {!isEdit && (
            <>
              <div>
                <Label htmlFor="name">Full name *</Label>
                <Input id="name" name="name" required />
                <FormError state={state} field="name" />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
                <FormError state={state} field="email" />
              </div>
              <div>
                <Label htmlFor="password">Initial password *</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
                <p className="mt-1 text-xs text-muted-foreground">At least 8 characters. They can change it after login.</p>
                <FormError state={state} field="password" />
              </div>
            </>
          )}

          {isEdit && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="font-medium">{user.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          )}

          <div>
            <Label htmlFor="roleId">Role *</Label>
            <select
              id="roleId"
              name="roleId"
              required
              defaultValue={user?.roleId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Select role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <FormError state={state} field="roleId" />
          </div>

          <div>
            <Label htmlFor="salesTargetMonthly">Monthly sales target (TZS)</Label>
            <Input
              id="salesTargetMonthly"
              name="salesTargetMonthly"
              type="number"
              min="0"
              step="1000"
              defaultValue={user?.salesTargetMonthly ?? 0}
            />
            <p className="mt-1 text-xs text-muted-foreground">Used for sales reps on the My Sales dashboard. Leave 0 if not applicable.</p>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={user.isActive} />
              Account active (can sign in)
            </label>
          )}

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{isEdit ? "Save" : "Add user"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
