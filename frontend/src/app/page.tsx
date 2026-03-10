'use client';

import React, { useState } from 'react';
import { useWallet } from '@/components/providers/WalletProviderWrapper';
import { usePositions } from '@/components/providers/PositionProvider';
import ActionModal from '@/components/modals/ActionModal';
import type { ActionType } from '@/types/lending';

const formatBTC = (sats: string) => {
    const n = Number(sats) / 1e8;
    if (n === 0) return '0.00';
    if (n < 0.01) return n.toFixed(6);
    return n.toFixed(4);
};

interface DisplayMarket {
    symbol: string;
    name: string;
    icon: string;
    iconBg: string;
    totalSupply: string;
    totalBorrow: string;
    supplyAPY: number;
    borrowAPY: number;
    utilization: number;
    isLive: boolean;
}

const MOCK_MARKETS: DisplayMarket[] = [
    { symbol: 'WBTC', name: 'Wrapped BTC', icon: '\u20BF', iconBg: 'from-amber-600 to-amber-800', totalSupply: '45200000000', totalBorrow: '18900000000', supplyAPY: 3.2, borrowAPY: 5.8, utilization: 41.8, isLive: false },
    { symbol: 'RUNES', name: 'Runes Token', icon: 'R', iconBg: 'from-purple-500 to-violet-600', totalSupply: '12800000000', totalBorrow: '3200000000', supplyAPY: 8.5, borrowAPY: 14.2, utilization: 25.0, isLive: false },
    { symbol: 'OP20', name: 'OP_NET Token', icon: 'O', iconBg: 'from-orange-600 to-red-500', totalSupply: '8500000000', totalBorrow: '5100000000', supplyAPY: 6.1, borrowAPY: 10.5, utilization: 60.0, isLive: false },
    { symbol: 'PIPE', name: 'Pipe Protocol', icon: 'P', iconBg: 'from-emerald-500 to-teal-600', totalSupply: '3200000000', totalBorrow: '960000000', supplyAPY: 4.8, borrowAPY: 9.2, utilization: 30.0, isLive: false },
    { symbol: 'STAMP', name: 'Bitcoin Stamps', icon: 'S', iconBg: 'from-pink-500 to-rose-600', totalSupply: '1500000000', totalBorrow: '300000000', supplyAPY: 7.3, borrowAPY: 12.8, utilization: 20.0, isLive: false },
];

export default function MarketsPage() {
    const { walletAddress, connect } = useWallet();
    const { market, pendingTx, executeAction } = usePositions();
    const [modalAction, setModalAction] = useState<ActionType | null>(null);

    const handleAction = async (amountSats: bigint) => {
        if (!modalAction) return;
        await executeAction(modalAction, amountSats);
    };

    const btcMarket: DisplayMarket = {
        symbol: 'BTC',
        name: 'Bitcoin',
        icon: '\u20BF',
        iconBg: 'from-orange-400 to-yellow-500',
        totalSupply: market.totalSupply,
        totalBorrow: market.totalBorrow,
        supplyAPY: market.supplyAPY,
        borrowAPY: market.borrowAPY,
        utilization: market.utilization,
        isLive: true,
    };

    const allMarkets = [btcMarket, ...MOCK_MARKETS];
    const totalTVL = allMarkets.reduce((sum, m) => sum + Number(m.totalSupply), 0);
    const totalBorrowed = allMarkets.reduce((sum, m) => sum + Number(m.totalBorrow), 0);
    const avgUtilization = allMarkets.length > 0 ? allMarkets.reduce((sum, m) => sum + m.utilization, 0) / allMarkets.length : 0;

    return (
        <div className="flex flex-col gap-10">
            {/* Hero */}
            <header className="flex flex-col gap-4 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Bitcoin <span className="text-gradient-orange">Lending</span> Protocol
                </h1>
                <p className="text-brown-300 text-lg leading-relaxed">
                    Lend, borrow, and earn yield on Bitcoin L1 powered by OP_NET.
                </p>
            </header>

            {/* Pending Transaction Banner */}
            {pendingTx && (
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-amber-300 font-medium">
                        Pending: <span className="font-mono">{pendingTx}</span> — waiting for on-chain confirmation...
                    </span>
                </div>
            )}

            {/* Protocol Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass rounded-2xl p-6 flex flex-col gap-2">
                    <span className="text-xs text-brown-400 uppercase font-bold">Total Value Locked</span>
                    <span className="text-3xl font-mono font-bold">{formatBTC(totalTVL.toString())}</span>
                    <span className="text-xs text-brown-400">BTC</span>
                </div>
                <div className="glass rounded-2xl p-6 flex flex-col gap-2">
                    <span className="text-xs text-brown-400 uppercase font-bold">Total Borrowed</span>
                    <span className="text-3xl font-mono font-bold text-orange-400">{formatBTC(totalBorrowed.toString())}</span>
                    <span className="text-xs text-brown-400">BTC</span>
                </div>
                <div className="glass rounded-2xl p-6 flex flex-col gap-2">
                    <span className="text-xs text-brown-400 uppercase font-bold">Avg Utilization</span>
                    <span className="text-3xl font-mono font-bold text-amber-400">{avgUtilization.toFixed(1)}%</span>
                    <span className="text-xs text-brown-400">across pools</span>
                </div>
                <div className="glass rounded-2xl p-6 flex flex-col gap-2">
                    <span className="text-xs text-brown-400 uppercase font-bold">Active Markets</span>
                    <span className="text-3xl font-mono font-bold text-white">{allMarkets.length}</span>
                    <span className="text-xs text-brown-400">tokens</span>
                </div>
            </div>

            {/* Market Table */}
            <div className="glass rounded-2xl overflow-hidden orange-glow">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Lending Markets</h2>
                    <span className="text-xs text-brown-400 font-mono">{allMarkets.length} assets</span>
                </div>
                <table className="w-full market-table">
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Total Supply</th>
                            <th>Total Borrow</th>
                            <th>Supply APY</th>
                            <th>Borrow APY</th>
                            <th>Utilization</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allMarkets.map((m) => (
                            <tr key={m.symbol}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${m.iconBg} flex items-center justify-center text-sm font-black ${m.symbol === 'BTC' ? '' : 'text-white'}`}>
                                            {m.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold flex items-center gap-2">
                                                {m.name}
                                                {m.isLive && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full">LIVE</span>}
                                                {!m.isLive && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brown-700 text-brown-300 rounded-full">SOON</span>}
                                            </div>
                                            <div className="text-xs text-brown-400">{m.symbol}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><div className="font-mono font-medium">{formatBTC(m.totalSupply)} {m.symbol}</div></td>
                                <td><div className="font-mono font-medium">{formatBTC(m.totalBorrow)} {m.symbol}</div></td>
                                <td><span className="text-emerald-400 font-bold font-mono">{m.supplyAPY.toFixed(2)}%</span></td>
                                <td><span className="text-orange-400 font-bold font-mono">{m.borrowAPY.toFixed(2)}%</span></td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-brown-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${m.utilization}%` }} />
                                        </div>
                                        <span className="text-xs font-mono text-brown-300">{m.utilization.toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex gap-2 justify-end">
                                        {m.isLive ? (
                                            walletAddress ? (
                                                <>
                                                    <button
                                                        onClick={() => setModalAction('deposit')}
                                                        className="px-4 py-2 text-xs font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/20 transition-colors"
                                                    >
                                                        Deposit
                                                    </button>
                                                    <button
                                                        onClick={() => setModalAction('borrow')}
                                                        className="px-4 py-2 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition-colors"
                                                    >
                                                        Borrow
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={connect}
                                                    className="px-4 py-2 text-xs font-bold bg-orange-500 text-brown-950 rounded-lg hover:bg-orange-400 transition-colors"
                                                >
                                                    Connect
                                                </button>
                                            )
                                        ) : (
                                            <span className="px-4 py-2 text-xs font-bold text-brown-500">Coming Soon</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* How it works */}
            <div className="glass rounded-2xl p-8 flex flex-col gap-6">
                <h3 className="font-bold text-lg">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 text-lg font-bold">1</div>
                        <h4 className="font-bold text-sm">Deposit Collateral</h4>
                        <p className="text-xs text-brown-300">Deposit BTC as collateral to start earning supply APY.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-lg font-bold">2</div>
                        <h4 className="font-bold text-sm">Borrow Against It</h4>
                        <p className="text-xs text-brown-300">Borrow up to 66% of your collateral value at the borrow APY.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg font-bold">3</div>
                        <h4 className="font-bold text-sm">Manage Position</h4>
                        <p className="text-xs text-brown-300">Monitor your health factor and repay loans to avoid liquidation.</p>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            <ActionModal
                isOpen={!!modalAction}
                onClose={() => setModalAction(null)}
                action={modalAction || 'deposit'}
                onSubmit={handleAction}
            />
        </div>
    );
}
