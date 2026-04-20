import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  return (
    <div className="mx-auto max-w-lg pt-16 px-4">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 text-amber-500" />
          <div>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {p && (
            <p className="text-muted-foreground">
              Required permission: <code className="font-mono text-xs">{p}</code>
            </p>
          )}
          <p className="text-muted-foreground">
            Ask an administrator to grant you this permission, or pick another area from the menu.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm"><Link href="/dashboard">Dashboard</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/settings">My settings</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
