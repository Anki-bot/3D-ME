import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/Layout/SmoothScroll";
import PostFX from "@/components/Layout/PostFX";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import ThemeCorners from "@/components/Theme/ThemeCorners";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const s=localStorage.getItem('immersive-theme');const m=window.matchMedia('(prefers-color-scheme: light)').matches;const t=s==='light'||s==='dark'?s:(m?'light':'dark');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SmoothScroll>{children}</SmoothScroll>
          <PostFX />
          <ThemeCorners />
        </ThemeProvider>
      </body>
    </html>
  );
}