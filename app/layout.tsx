import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AAA Roadside XO",
  description: "A polished, free-to-play AAA-branded tic-tac-toe game that leverages the AAA membership base for casual entertainment and brand engagement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
