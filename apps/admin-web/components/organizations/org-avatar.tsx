import { cn } from "@bokdy/ui";

const AVATAR_COLORS = [
  "text-sky-600 dark:text-sky-400 border-sky-500/40 bg-sky-500/10",
  "text-violet-600 dark:text-violet-400 border-violet-500/40 bg-violet-500/10",
  "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10",
  "text-pink-600 dark:text-pink-400 border-pink-500/40 bg-pink-500/10",
  "text-indigo-600 dark:text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
  "text-teal-600 dark:text-teal-400 border-teal-500/40 bg-teal-500/10",
] as const;

export function orgInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

function colorClassForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

type OrgAvatarProps = {
  name: string;
  size?: "sm" | "md";
  className?: string;
};

export function OrgAvatar({ name, size = "md", className }: OrgAvatarProps) {
  const px = size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border font-extrabold tracking-tight",
        px,
        colorClassForName(name),
        className,
      )}
      aria-hidden
    >
      {orgInitials(name)}
    </div>
  );
}
