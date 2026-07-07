import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Implied Volatility Surface",
  description:
    "Real-time implied volatility surface for equity options, computed with the Black-Scholes model.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
