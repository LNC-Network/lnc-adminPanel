import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Administrative Panel",
  description: "LNC Product [LNC 2024 All Rights Reserved]",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
