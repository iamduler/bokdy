/** Shared heading for admin auth forms (brand lives in AdminAuthShell). */
export function AdminAuthHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold tracking-tight text-shell-text sm:text-2xl">{title}</h1>
      {description ? (
        <p className="text-sm leading-6 text-shell-text-muted">{description}</p>
      ) : null}
    </div>
  );
}

/** Applied to plain AuthField input (no leading icon). */
export const austereFieldClassName =
  "h-11 cursor-text rounded-md border-shell-border bg-shell-card text-shell-text shadow-none transition-colors duration-200 placeholder:text-shell-text-muted hover:border-shell-border-strong focus-visible:ring-2 focus-visible:ring-shell-accent focus-visible:ring-offset-2 focus-visible:ring-offset-shell-card";

/** Applied to AuthField/AuthPasswordField wrapper when leading icon is present. */
export const austereFieldWrapClassName =
  "h-11 rounded-md border-shell-border bg-shell-card transition-colors duration-200 focus-within:ring-2 focus-within:ring-shell-accent focus-within:ring-offset-2 focus-within:ring-offset-shell-card";

export const austerePasswordWrapClassName = austereFieldWrapClassName;

export const austereActionClassName =
  "h-11 cursor-pointer rounded-md font-semibold tracking-wide transition-colors duration-200";
