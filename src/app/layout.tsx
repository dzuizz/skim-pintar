import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skim Pintar | Masjid Ar-Raudhah",
  description:
    "Support Ar-Raudhah's community initiatives through convenient recurring donations via PayNow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} bg-warmWhite text-gray-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
