import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "vi"],
  defaultLocale: "vi",
  localePrefix: "as-needed",
  // Unprefixed URLs are always vi. Do not redirect /login → /en/login from Accept-Language.
  localeDetection: false,
});
