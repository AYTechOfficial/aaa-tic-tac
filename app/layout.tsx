import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripleA Tic-Tac-Toe",
  description: "A high-fidelity, polished 3D game execution of Tic-Tac-Toe featuring advanced graphics, online multiplayer match-making, and procedural audio effects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
