import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AAA Tic Tac Toe",
  description: "A cinematic, modern 3D rendition of classic grid puzzle mechanics featuring high-fidelity graphics, game-changing board modifiers, and competitive matchmaking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
