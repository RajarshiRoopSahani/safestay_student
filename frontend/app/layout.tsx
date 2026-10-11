import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/hooks/useFavorites";
import { CompareProvider } from "@/hooks/useCompare";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompareBar from "@/components/CompareBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SafeStay Student | Find Better. Stay Safer.",
  description:
    "Search hostels, PGs and rooms near your college. See community photos, honest reviews and compare rents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <AuthProvider>
          <FavoritesProvider>
            <CompareProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <CompareBar />
            </CompareProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
