import { Avatar, AvatarFallback, AvatarImage, cn } from "@bokdy/ui";

export function entityInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

type EntityAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  src?: string;
};

export function EntityAvatar({ name, size = "md", className, src }: EntityAvatarProps) {
  const sizeClass = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : undefined;

  return (
    <Avatar className={cn(sizeClass, className)} aria-hidden>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback>{entityInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
