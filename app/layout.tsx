import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Triad Arena",
  description: "A high-production-value, cross-platform 3D puzzle game that expands classic tic-tac-toe mechanics with competitive multiplayer ladders and dynamic game variants.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
