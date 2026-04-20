"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isForbidden = error.message.startsWith("Forbidden:");

  useEffect(() => {
    if (!isForbidden) console.error(error);
  }, [error, isForbidden]);

  if (isForbidden) {
    const perm = error.message.replace(/^Forbidden:\s*missing\s*/, "");
    return (
      <div className="mx-auto max-w-lg pt-12">
        <Card>
          <CardHeader className="flex flex-row items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 text-amber-500" />
            <div>
              <CardTitle>Access denied</CardTitle>
              <CardDescription>You do not have permission to view this page.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Required permission: <code className="font-mono text-xs">{perm}</code>
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm"><Link href="/dashboard">Back to dashboard</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/settings">My settings</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pt-12">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 text-destructive" />
          <div>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>An unexpected error occurred while loading this page.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <pre className="overflow-auto rounded bg-muted p-3 text-xs">{error.message}</pre>
          {error.digest && (
            <p className="text-xs text-muted-foreground">Digest: {error.digest}</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={reset}>Try again</Button>
            <Button asChild size="sm" variant="outline"><Link href="/dashboard">Dashboard</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
