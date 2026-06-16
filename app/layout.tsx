import type { Metadata } from "next";
import { Geist_Mono, Inter, Sofia_Sans_Extra_Condensed } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/auth";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const sofia = Sofia_Sans_Extra_Condensed({
  variable: "--font-sofia",
  subsets: ["latin"],
  weight: ["800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dime Droppers Fan Hub Admin",
  description: "Fan Hub setup and management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sofia.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
