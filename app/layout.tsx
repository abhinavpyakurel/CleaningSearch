import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "CleanMatch",
  description: "Book trusted cleaners or offer cleaning services",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* <SiteHeader /> */}
        {children}
      </body>
    </html>
  );
}