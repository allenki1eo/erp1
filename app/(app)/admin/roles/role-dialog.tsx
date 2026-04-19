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
import { upsertRole } from "@/server/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";

const PERM_GROUPS: { label: string; perms: { key: string; label: string }[] }[] = [
  {
    label: "Administration",
    perms: [
      { key: PERMISSIONS.COMPANY_MANAGE, label: "Manage company" },
      { key: PERMISSIONS.USER_MANAGE, label: "Manage users & roles" },
    ],
  },
  {
    label: "Masters",
    perms: [
      { key: PERMISSIONS.PRODUCT_MANAGE, label: "Manage products" },
      { key: PERMISSIONS.RECIPE_MANAGE, label: "Manage recipes" },
    ],
  },
  {
    label: "Procurement",
    perms: [
      { key: PERMISSIONS.PROCUREMENT_WRITE, label: "Create purchase docs" },
      { key: PERMISSIONS.PROCUREMENT_APPROVE, label: "Approve purchase docs" },
      { key: PERMISSIONS.PROCUREMENT_MANAGE, label: "Manage procurement" },
    ],
  },
  {
    label: "Inventory & production",
    perms: [
      { key: PERMISSIONS.INVENTORY_WRITE, label: "Write inventory" },
      { key: PERMISSIONS.INVENTORY_MANAGE, label: "Manage inventory" },
      { key: PERMISSIONS.PRODUCTION_MANAGE, label: "Manage production" },
      { key: PERMISSIONS.QUALITY_MANAGE, label: "Manage quality" },
    ],
  },
  {
    label: "Excise & regulatory",
    perms: [
      { key: PERMISSIONS.EXCISE_MANAGE, label: "Manage excise" },
      { key: PERMISSIONS.EXCISE_DECLARE, label: "Submit excise declarations" },
      { key: PERMISSIONS.TAX_STAMP_MANAGE, label: "Manage tax stamps" },
    ],
  },
  {
    label: "Commercial",
    perms: [
      { key: PERMISSIONS.SALES_MANAGE, label: "Manage all sales" },
      { key: PERMISSIONS.SALES_OWN, label: "Sales rep (own orders)" },
      { key: PERMISSIONS.FINANCE_WRITE, label: "Record payments" },
      { key: PERMISSIONS.FINANCE_MANAGE, label: "Manage finance" },
      { key: PERMISSIONS.REPORTS_VIEW, label: "View reports" },
    ],
  },
  {
    label: "Transport",
    perms: [
      { key: PERMISSIONS.TRANSPORT_MANAGE, label: "Manage transport" },
      { key: PERMISSIONS.TRANSPORT_CROSS_COMPANY, label: "Cross-company transport" },
    ],
  },
];

type Role = { id: string; name: string; permissions: string[] };

export function RoleDialog({ role }: { role?: Role }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(upsertRole, null);
  const isEdit = !!role;

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Role updated" : "Role created");
      setOpen(false);
    }
  }, [state, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
        ) : (
          <Button><Plus className="size-4" /> New role</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit role" : "New role"}</DialogTitle>
          <DialogDescription>Select the permissions this role grants.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={role.id} />}

          <div>
            <Label htmlFor="name">Role name *</Label>
            <Input id="name" name="name" defaultValue={role?.name} required />
            <FormError state={state} field="name" />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Permissions</div>
            {PERM_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1 rounded-md border bg-muted/30 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </div>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {group.perms.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name={`perm:${p.key}`}
                        defaultChecked={role?.permissions.includes(p.key)}
                      />
                      <span>{p.label}</span>
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground">{p.key}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <FormError state={state} />
          <DialogFooter>
            <SubmitButton>{isEdit ? "Save" : "Create role"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
