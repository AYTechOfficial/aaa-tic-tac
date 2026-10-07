import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GridStrike AAA Tic-Tac-Toe",
  description: "A focused AAA Tic-Tac-Toe game product bringing cinematic visual polish, visceral camera feedback, and dynamic sound synthesis to a classic browser board game.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
