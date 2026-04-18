import type { ActionResult } from "@/lib/actions";

export function FormError({ state, field }: { state: ActionResult | null; field?: string }) {
  if (!state || state.ok) return null;
  if (field) {
    const msgs = state.fieldErrors?.[field];
    if (!msgs?.length) return null;
    return <p className="mt-1 text-xs text-destructive">{msgs.join(", ")}</p>;
  }
  return <p className="text-sm text-destructive">{state.error}</p>;
}
