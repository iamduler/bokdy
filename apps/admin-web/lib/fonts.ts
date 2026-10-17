import { Geist } from "next/font/google";

export const geist = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const fontVariables = geist.variable;
