import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skim Pintar | Masjid Ar-Raudhah",
  description:
    "Join 2,000+ members building community through education, welfare, and faith at Masjid Ar-Raudhah — from just $5/month.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('theme');if(m==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} bg-warmWhite dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
