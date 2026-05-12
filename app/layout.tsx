import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Hired.jo — AI Career Copilot for Jordanian Graduates",
  description: "Build your CV in 5 minutes, match with real Jordan jobs, and get your Hired Score. Powered by Gemini 2.0.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col grain">{children}</body>
    </html>
  );
}
