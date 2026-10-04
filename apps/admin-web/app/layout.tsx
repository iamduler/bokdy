import type { Metadata, ReactNode } from "next";
import { bokdyIconsMetadata } from "@bokdy/brand";
import "./globals.css";

export const metadata: Metadata = {
  ...bokdyIconsMetadata,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
