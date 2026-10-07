import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AAA Tic Tac Toe",
  description: "A premium, visually stunning, and highly polished tic-tac-toe game, differentiating itself from generic versions by focusing on an 'AAA' user experience in a simple, classic format.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
