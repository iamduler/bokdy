const LOCALE_PREFIX = /^\/(en|vi)(?=\/|$)/;

/** In-app path to restore after login. Rejects other sites and auth screens. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return null;
  }
  const hashAt = value.indexOf("#");
  const hash = hashAt >= 0 ? value.slice(hashAt) : "";
  const withoutHash = hashAt >= 0 ? value.slice(0, hashAt) : value;
  const queryAt = withoutHash.indexOf("?");
  const path = queryAt >= 0 ? withoutHash.slice(0, queryAt) : withoutHash;
  const search = queryAt >= 0 ? withoutHash.slice(queryAt) : "";
  const stripped = path.replace(LOCALE_PREFIX, "") || "/";
  if (
    stripped === "/login" ||
    stripped.startsWith("/login/") ||
    stripped === "/forgot-password" ||
    stripped.startsWith("/forgot-password/") ||
    stripped === "/reset-password" ||
    stripped.startsWith("/reset-password/") ||
    stripped === "/register" ||
    stripped.startsWith("/register/")
  ) {
    return null;
  }
  return `${stripped}${search}${hash}`;
}

export function loginHref(from: string): string {
  const next = safeNextPath(from);
  if (!next) return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}
