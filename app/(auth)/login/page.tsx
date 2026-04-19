"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/crud/form-error";
import { SubmitButton } from "@/components/crud/submit-button";
import { loginUser } from "@/server/actions/register";

export default function LoginPage() {
  const [state, action] = useActionState(loginUser, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.push("/dashboard");
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Beverage ERP</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
              <FormError state={state} field="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
              <FormError state={state} field="password" />
            </div>
            <FormError state={state} />
            <SubmitButton className="w-full">Sign in</SubmitButton>
            <p className="text-center text-sm text-muted-foreground">
              No account? <Link href="/register" className="text-primary hover:underline">Register</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
