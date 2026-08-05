import type { Metadata, Viewport } from "next";
import { Press_Start_2P, Silkscreen } from "next/font/google";
import CursorSparkles from "@/components/pixel/CursorSparkles";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  variable: "--font-press-start-2p",
  weight: "400",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Echo",
  description: "A retro pixel check-in tracker — pin your stops, track your spend.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Echo",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff4fa3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pressStart2P.variable} ${silkscreen.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-desk text-ink">
        <CursorSparkles />
        {children}
      </body>
    </html>
  );
}
