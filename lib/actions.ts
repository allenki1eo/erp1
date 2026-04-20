import { z } from "zod";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// Sentinel used by optional <Select> dropdowns: Radix forbids value=""
// for SelectItem, so we emit this instead and strip it here.
export const SELECT_NONE = "__none";

export function fromFormData<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData
): z.SafeParseReturnType<z.input<T>, z.output<T>> {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && (value === "" || value === SELECT_NONE)) continue;
    raw[key] = value;
  }
  return schema.safeParse(raw);
}

export function errorFromParse(
  parsed: z.SafeParseError<unknown>
): ActionResult {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const path = issue.path.join(".");
    (fieldErrors[path] ||= []).push(issue.message);
  }
  return { ok: false, error: "Invalid input", fieldErrors };
}
