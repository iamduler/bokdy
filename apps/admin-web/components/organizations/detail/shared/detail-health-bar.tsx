import { cn } from "@bokdy/ui";

type DetailHealthBarProps = {
  score: number;
  size?: "sm" | "md";
  className?: string;
};

export function DetailHealthBar({ score, size = "md", className }: DetailHealthBarProps) {
  const colorClass =
    score >= 80
      ? "bg-emerald-500 text-emerald-600 dark:text-emerald-400"
      : score >= 60
        ? "bg-amber-500 text-amber-600 dark:text-amber-400"
        : "bg-destructive text-destructive";

  const barWidth = size === "md" ? "w-[60px]" : "w-10";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("h-1.5 rounded-full bg-muted", barWidth)}>
        <div
          className={cn("h-full rounded-full", colorClass.split(" ")[0])}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={cn("font-bold", size === "md" ? "text-xs" : "text-[11px]", colorClass.split(" ").slice(1).join(" "))}>
        {score}
      </span>
    </div>
  );
}
