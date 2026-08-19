/** Applies identity theme: `light` | `dark` | `system`. Default system = OS. */
export const THEME_STORAGE_KEY = "bokdy-theme";

export type BokdyTheme = "light" | "dark" | "system";

export function applyBokdyTheme(theme: BokdyTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "light") root.classList.add("light");
  if (theme === "dark") root.classList.add("dark");
}

const bootScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var r=document.documentElement;r.classList.remove("light","dark");if(t==="light")r.classList.add("light");else if(t==="dark")r.classList.add("dark");}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: bootScript }} />;
}
