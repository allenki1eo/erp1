"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { PasswordStrength } from "@/components/password-strength";
import { registerUser } from "@/server/actions/register";

export default function RegisterPage() {
  const [state, action] = useActionState(registerUser, null);
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.push("/dashboard");
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Get started with Beverage ERP</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required />
              <FormError state={state} field="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
              <FormError state={state} field="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FormError state={state} field="password" />
              <PasswordStrength password={password} />
            </div>
            <FormError state={state} />
            <SubmitButton className="w-full">Create account</SubmitButton>
            <p className="text-center text-sm text-muted-foreground">
              Already have one? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
