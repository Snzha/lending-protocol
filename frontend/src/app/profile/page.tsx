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

const formatUSD = (sats: string, price: number) => {
    const btc = Number(sats) / 1e8;
    const usd = btc * price;
    if (usd === 0) return '$0.00';
    if (usd < 1) return `$${usd.toFixed(4)}`;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatHealth = (h: number) => {
    if (h >= 99999) return '\u221E';
    return (h / 100).toFixed(2);
};

const healthColor = (h: number) => {
    if (h >= 99999) return 'text-emerald-400';
    if (h >= 150) return 'text-emerald-400';
    if (h >= 120) return 'text-yellow-400';
    return 'text-red-400';
};

const healthBarColor = (h: number) => {
    if (h >= 150) return 'bg-emerald-500';
    if (h >= 120) return 'bg-yellow-500';
    return 'bg-red-500';
};

const BTC_PRICE = 97500;

export default function ProfilePage() {
    const { walletAddress, connect } = useWallet();
    const { position, market, pendingTx, executeAction } = usePositions();
    const [modalAction, setModalAction] = useState<ActionType | null>(null);

    const handleAction = async (amountSats: bigint) => {
        if (!modalAction) return;
        await executeAction(modalAction, amountSats);
    };

    if (!walletAddress) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 py-32">
                <div className="w-20 h-20 rounded-full bg-brown-800 flex items-center justify-center text-3xl">&#x1F512;</div>
                <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
                <p className="text-brown-300 text-center max-w-md">Connect your OP Wallet to view your lending positions, health factor, and manage your portfolio.</p>
                <button onClick={connect} className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-400 text-brown-950 rounded-xl font-bold hover:opacity-90 transition-opacity">
                    Connect Wallet
                </button>
            </div>
        );
    }

    const deposited = position.deposited;
    const borrowed = position.borrowed;
    const health = position.healthFactor;
    const netWorth = position.netWorth;
    const borrowLimit = position.borrowLimit;
    const hasDeposit = Number(deposited) > 0;
    const hasBorrow = Number(borrowed) > 0;
    const borrowUsedPercent = Number(borrowLimit) > 0 ? (Number(borrowed) / Number(borrowLimit)) * 100 : 0;

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="flex gap-2">
                    <button onClick={() => setModalAction('deposit')} className="px-4 py-2 text-sm font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/20 transition-colors">
                        + Deposit
                    </button>
                    <button onClick={() => setModalAction('borrow')} className="px-4 py-2 text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition-colors">
                        + Borrow
                    </button>
                </div>
            </div>

            {/* Pending Transaction Banner */}
            {pendingTx && (
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-amber-300 font-medium">
                        Pending: <span className="font-mono">{pendingTx}</span> — waiting for on-chain confirmation...
                    </span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass rounded-2xl p-6 flex flex-col gap-2">
                    <span className="text-xs text-brown-400 uppercase font-bold">Your Deposits</span>
                    <span className="text-2xl font-mono font-bold">{formatBTC(deposited)}</span>
                    <span className="text-xs text-brown-400">BTC ~ {formatUSD(deposited, BTC_PRICE)}</span>
                </div>
                <div className="glass rounded-2xl p-6 flex flex-col gap-2">
                    <span className="text-xs text-brown-400 uppercase font-bold">Your Borrows</span>
                    <span className="text-2xl font-mono font-bold text-orange-400">{formatBTC(borrowed)}</span>
                    <span className="text-xs text-brown-400">BTC ~ {formatUSD(borrowed, BTC_PRICE)}</span>
                </div>
                <div className="glass rounded-2xl p-6 flex flex-col gap-2">
                    <span className="text-xs text-brown-400 uppercase font-bold">Health Factor</span>
                    <span className={`text-2xl font-mono font-bold ${healthColor(health)}`}>
                        {formatHealth(health)}
                    </span>
                    <span className="text-xs text-brown-400">{health >= 150 ? 'Safe' : health >= 120 ? 'Caution' : 'At Risk'}</span>
                </div>
                <div className="glass rounded-2xl p-6 flex flex-col gap-2">
                    <span className="text-xs text-brown-400 uppercase font-bold">Net Worth</span>
                    <span className="text-2xl font-mono font-bold text-emerald-400">{formatBTC(netWorth)}</span>
                    <span className="text-xs text-brown-400">BTC ~ {formatUSD(netWorth, BTC_PRICE)}</span>
                </div>
            </div>

            {/* Health Factor + Borrow Limit Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-sm text-brown-200">Health Factor</h3>
                        <span className={`font-mono font-bold ${healthColor(health)}`}>
                            {formatHealth(health)}x
                        </span>
                    </div>
                    <div className="w-full h-3 bg-brown-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${healthBarColor(health)}`}
                            style={{ width: `${hasBorrow ? Math.min((health / 300) * 100, 100) : 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-brown-400">
                        <span>Liquidation (1.0x)</span>
                        <span>Safe (1.5x+)</span>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-sm text-brown-200">Borrow Limit Used</h3>
                        <span className="font-mono font-bold text-amber-400">
                            {borrowUsedPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full h-3 bg-brown-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(borrowUsedPercent, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-brown-400">
                        <span>{formatBTC(borrowed)} borrowed</span>
                        <span>{formatBTC(borrowLimit)} limit</span>
                    </div>
                </div>
            </div>

            {/* Your Positions - Deposits */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                    <h2 className="font-bold text-brown-100">Your Deposits</h2>
                    <button onClick={() => setModalAction('deposit')} className="px-4 py-2 text-xs font-bold bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
                        + Deposit
                    </button>
                </div>
                <table className="w-full market-table">
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Deposited</th>
                            <th>USD Value</th>
                            <th>Supply APY</th>
                            <th>Borrow Limit</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hasDeposit ? (
                            <tr>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-xs font-black">&#8383;</div>
                                        <div>
                                            <span className="font-bold">BTC</span>
                                            <div className="text-xs text-brown-400">Bitcoin</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="font-mono font-bold">{formatBTC(deposited)}</span></td>
                                <td><span className="font-mono text-brown-200">{formatUSD(deposited, BTC_PRICE)}</span></td>
                                <td><span className="text-emerald-400 font-mono font-bold">{market.supplyAPY?.toFixed(2) || '5.00'}%</span></td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 max-w-20 h-1.5 bg-brown-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(borrowUsedPercent, 100)}%` }} />
                                        </div>
                                        <span className="font-mono text-xs text-brown-300">{formatBTC(borrowed)} / {formatBTC(borrowLimit)}</span>
                                    </div>
                                </td>
                                <td className="text-right">
                                    <button onClick={() => setModalAction('withdraw')} className="px-3 py-1.5 text-xs font-bold bg-brown-700 hover:bg-brown-600 text-brown-100 rounded-lg transition-colors">
                                        Withdraw
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            <tr><td colSpan={6} className="text-center text-brown-500 py-8">No active deposits. Deposit BTC to start earning yield.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Your Positions - Borrows */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                    <h2 className="font-bold text-brown-100">Your Borrows</h2>
                    <button onClick={() => setModalAction('borrow')} className="px-4 py-2 text-xs font-bold bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                        + Borrow
                    </button>
                </div>
                <table className="w-full market-table">
                    <thead>
                        <tr>
                            <th>Asset</th>
                            <th>Borrowed</th>
                            <th>USD Value</th>
                            <th>Borrow APY</th>
                            <th>Health Factor</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hasBorrow ? (
                            <tr>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-xs font-black">&#8383;</div>
                                        <div>
                                            <span className="font-bold">BTC</span>
                                            <div className="text-xs text-brown-400">Bitcoin</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="font-mono font-bold">{formatBTC(borrowed)}</span></td>
                                <td><span className="font-mono text-brown-200">{formatUSD(borrowed, BTC_PRICE)}</span></td>
                                <td><span className="text-orange-400 font-mono font-bold">{market.borrowAPY?.toFixed(2) || '8.00'}%</span></td>
                                <td>
                                    <span className={`font-mono font-bold ${healthColor(health)}`}>
                                        {formatHealth(health)}x
                                    </span>
                                </td>
                                <td className="text-right">
                                    <button onClick={() => setModalAction('repay')} className="px-3 py-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-colors">
                                        Repay
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            <tr><td colSpan={6} className="text-center text-brown-500 py-8">No active borrows</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Action Modal */}
            <ActionModal
                isOpen={!!modalAction}
                onClose={() => setModalAction(null)}
                action={modalAction || 'deposit'}
                onSubmit={handleAction}
                maxAmount={
                    modalAction === 'withdraw' ? position.deposited :
                    modalAction === 'repay' ? position.borrowed :
                    modalAction === 'borrow' ? position.borrowLimit : undefined
                }
            />
        </div>
    );
}
