import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TranscriptProvider } from "@/contexts/TranscriptContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CA Uncle Bot - Financial Advisor",
  description: "Voice-first financial advisor bot to help you make better money decisions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TranscriptProvider>
            <ConnectionProvider>
              {children}
            </ConnectionProvider>
          </TranscriptProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
