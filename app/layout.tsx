import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { TopBar } from "@/components/TopBar";

export const metadata: Metadata = {
  title: "Bunker Desk — Marine Fuels & Tanker Intelligence",
  description:
    "Institutional-grade marine fuels and tanker-market intelligence. Provenance-first: every metric carries source, timestamp and freshness.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Nav />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
