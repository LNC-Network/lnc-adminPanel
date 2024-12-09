import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/hooks/setTheme";
export const metadata: Metadata = {
  title: "Control panel",
  description: "LNC Product [LNC 2024 All Rights Reserved]",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
