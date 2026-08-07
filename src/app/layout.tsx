import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/Layout/SmoothScroll";

export const metadata: Metadata = {
  title: "Immersive Portfolio",
  description: "Award-winning interactive website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}