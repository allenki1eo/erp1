"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";

type Rule = { id: string; label: string; test: (pw: string) => boolean };

const RULES: Rule[] = [
  { id: "len", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { id: "upper", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { id: "digit", label: "One digit", test: (pw) => /[0-9]/.test(pw) },
  { id: "symbol", label: "One symbol (bonus)", test: (pw) => /[^a-zA-Z0-9]/.test(pw) },
];

const LEVELS = [
  { label: "Too weak", color: "bg-destructive" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Good", color: "bg-lime-500" },
  { label: "Strong", color: "bg-green-600" },
];

export function PasswordStrength({ password }: { password: string }) {
  const { score, checks } = useMemo(() => {
    const checks = RULES.map((r) => ({ ...r, passed: r.test(password) }));
    const score = checks.filter((c) => c.passed).length;
    return { score, checks };
  }, [password]);

  if (!password) return null;
  const level = LEVELS[Math.min(score, LEVELS.length - 1)];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {LEVELS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < score ? level.color : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className="font-medium text-foreground">{level.label}</span>
      </p>
      <ul className="space-y-1">
        {checks.map((c) => (
          <li
            key={c.id}
            className={`flex items-center gap-1.5 text-xs ${c.passed ? "text-green-600" : "text-muted-foreground"}`}
          >
            {c.passed ? <Check className="size-3" /> : <X className="size-3" />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
