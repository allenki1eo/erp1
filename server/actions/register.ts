"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { signIn } from "@/lib/auth";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const PasswordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Needs a lowercase letter")
  .regex(/[A-Z]/, "Needs an uppercase letter")
  .regex(/[0-9]/, "Needs a digit");

const RegisterSchema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Invalid email"),
  password: PasswordSchema,
});

export async function registerUser(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = fromFormData(RegisterSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  try {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return { ok: false, error: "Email already registered" };

    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(users).values({ name, email, passwordHash });
  } catch (err) {
    console.error("registerUser db error", err);
    return { ok: false, error: "Could not create account. Try again." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Account created, but sign-in failed. Try logging in." };
    }
    throw err; // NEXT_REDIRECT — rethrow so Next handles it
  }
  return { ok: true };
}

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export async function loginUser(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = fromFormData(LoginSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { password } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Invalid email or password." };
    }
    throw err;
  }
  return { ok: true };
}
