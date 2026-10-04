export { BokdyMark, type BokdyMarkProps } from "./bokdy-mark";

/** Static paths served from each app `public/` after `pnpm brand:sync-public`. */
export const bokdyFaviconPaths = {
  ico: "/favicon.ico",
  svg: "/favicon.svg",
  png96: "/favicon-96x96.png",
  apple: "/apple-touch-icon.png",
  manifest192: "/web-app-manifest-192x192.png",
  manifest512: "/web-app-manifest-512x512.png",
  manifest: "/site.webmanifest",
} as const;

export const bokdyIconsMetadata: {
  icons: {
    icon: Array<{ url: string; type?: string; sizes?: string }>;
    apple: Array<{ url: string; sizes?: string }>;
  };
  manifest: string;
} = {
  icons: {
    icon: [
      { url: bokdyFaviconPaths.ico },
      { url: bokdyFaviconPaths.svg, type: "image/svg+xml" },
      { url: bokdyFaviconPaths.png96, sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: bokdyFaviconPaths.apple, sizes: "180x180" }],
  },
  manifest: bokdyFaviconPaths.manifest,
};
