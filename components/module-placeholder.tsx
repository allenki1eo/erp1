import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ModulePlaceholder({
  title,
  description,
  todo,
}: {
  title: string;
  description: string;
  todo?: string[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>This module is scaffolded. Implementation pending.</CardDescription>
        </CardHeader>
        {todo && todo.length > 0 && (
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {todo.map((t) => (<li key={t}>{t}</li>))}
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
