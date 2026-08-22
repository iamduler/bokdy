"use client";

import { THEME_BOOT_SCRIPT, ThemeSync } from "@bokdy/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useServerInsertedHTML } from "next/navigation";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  // Inject outside the client React tree (avoids React 19 / Next 16 script warning).
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
  ));

  return (
    <QueryClientProvider client={client}>
      <ThemeSync />
      {children}
    </QueryClientProvider>
  );
}
