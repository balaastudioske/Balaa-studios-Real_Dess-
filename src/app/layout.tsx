import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "BALAA STUDIOS",
  description: "Web-native 3D performance platform by BALAA STUDIOS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
