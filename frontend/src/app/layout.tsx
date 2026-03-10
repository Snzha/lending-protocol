import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import WalletProviderWrapper from "@/components/providers/WalletProviderWrapper";
import PositionProvider from "@/components/providers/PositionProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "BTCLend | Bitcoin L1 Lending Protocol",
    description: "Lend, borrow, and earn on Bitcoin L1 using OP_NET.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <WalletProviderWrapper>
                    <PositionProvider>
                        <Navbar />
                        <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                            {children}
                        </main>
                    </PositionProvider>
                </WalletProviderWrapper>
            </body>
        </html>
    );
}
