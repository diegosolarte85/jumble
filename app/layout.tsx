import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jumble - Co-founder Matching",
  description: "Connecting business ideas and creators together",
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

