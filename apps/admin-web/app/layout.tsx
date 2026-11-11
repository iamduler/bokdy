import type { Metadata, ReactNode } from "next";
import { bokdyIconsMetadata } from "@bokdy/brand";
import { getLocale } from "next-intl/server";

import { fontVariables } from "@/lib/fonts";
import "@/lib/maps/engine-css";
import "./globals.css";

export const metadata: Metadata = {
  ...bokdyIconsMetadata,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
