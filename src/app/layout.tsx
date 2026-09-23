import type { Metadata } from "next";
import { Nunito, Merriweather, Caveat, Patrick_Hand, Dancing_Script, Itim } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["vietnamese", "latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700"],
  subsets: ["latin", "latin-ext"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  weight: ["400"],
  subsets: ["vietnamese", "latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["vietnamese", "latin"],
});

const itim = Itim({
  variable: "--font-itim",
  weight: ["400"],
  subsets: ["vietnamese", "latin"],
});

export const metadata: Metadata = {
  title: "Class Memories - Lớp 9A",
  description: "Nơi lưu giữ thanh xuân và kỷ niệm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${nunito.variable} ${merriweather.variable} ${caveat.variable} ${patrickHand.variable} ${dancingScript.variable} ${itim.variable}`}
    >
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
