'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/components/providers/WalletProviderWrapper';

export default function Navbar() {
    const pathname = usePathname();
    const { walletAddress, balance, connect, disconnect } = useWallet();

    const navItems = [
        { href: '/', label: 'Markets' },
        { href: '/profile', label: 'Dashboard' },
    ];

    const formatBTC = (sats: number) => (sats / 1e8).toFixed(4);
    const shortAddress = walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : '';

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(18, 10, 4, 0.85)' }}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-xs font-black text-brown-950">B</div>
                        <span className="text-lg font-bold tracking-tight">BTC<span className="text-orange-400">Lend</span></span>
                    </Link>
                    <div className="flex gap-1">
                        {navItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    pathname === item.href
                                        ? 'bg-orange-500/15 text-orange-300'
                                        : 'text-brown-300 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {walletAddress ? (
                        <>
                            <span className="text-sm font-mono text-brown-200">{formatBTC(balance)} BTC</span>
                            <button
                                onClick={disconnect}
                                className="px-4 py-2 text-sm font-medium bg-brown-800 hover:bg-brown-700 rounded-lg border border-brown-600 transition-colors text-brown-100"
                            >
                                {shortAddress}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={connect}
                            className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-400 text-brown-950 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
