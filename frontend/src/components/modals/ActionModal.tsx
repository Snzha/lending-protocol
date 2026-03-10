'use client';

import React, { useState } from 'react';
import type { ActionType } from '@/types/lending';

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    action: ActionType;
    onSubmit: (amount: bigint) => Promise<void>;
    maxAmount?: string; // in sats
}

const ACTION_CONFIG: Record<ActionType, { title: string; buttonText: string; color: string }> = {
    deposit: { title: 'Deposit BTC', buttonText: 'Deposit', color: 'bg-orange-500 hover:bg-orange-400 text-brown-950' },
    withdraw: { title: 'Withdraw BTC', buttonText: 'Withdraw', color: 'bg-brown-600 hover:bg-brown-500 text-white' },
    borrow: { title: 'Borrow BTC', buttonText: 'Borrow', color: 'bg-amber-500 hover:bg-amber-400 text-brown-950' },
    repay: { title: 'Repay Loan', buttonText: 'Repay', color: 'bg-emerald-500 hover:bg-emerald-400 text-brown-950' },
};

export default function ActionModal({ isOpen, onClose, action, onSubmit, maxAmount }: ActionModalProps) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [txResult, setTxResult] = useState<string | null>(null);

    if (!isOpen) return null;

    const config = ACTION_CONFIG[action];
    const maxBTC = maxAmount ? (Number(maxAmount) / 1e8).toFixed(8) : undefined;

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;

        setLoading(true);
        setTxResult(null);
        try {
            const satoshis = BigInt(Math.floor(parseFloat(amount) * 1e8));
            await onSubmit(satoshis);
            setTxResult('Transaction sent successfully!');
            setAmount('');
        } catch (err: any) {
            setTxResult(`Error: ${err?.message || String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
            <div
                className="rounded-2xl p-8 w-full max-w-md flex flex-col gap-6 border border-white/10"
                style={{ background: 'rgba(26, 15, 5, 0.97)', backdropFilter: 'blur(12px)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">{config.title}</h2>
                    <button onClick={onClose} className="text-brown-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-xs text-brown-400 font-bold uppercase">Amount (BTC)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.001"
                            step="0.0001"
                            min="0"
                            className="w-full bg-brown-900 border border-brown-700 focus:border-orange-500 outline-none py-4 px-4 rounded-xl font-mono text-lg transition-all text-white"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brown-400 font-bold text-sm">BTC</div>
                    </div>
                    <div className="flex gap-2">
                        {['0.001', '0.005', '0.01', '0.05'].map(val => (
                            <button
                                key={val}
                                onClick={() => setAmount(val)}
                                className="flex-1 py-1.5 text-xs font-mono bg-brown-800 hover:bg-brown-700 text-brown-200 rounded-lg transition-colors"
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                    {maxBTC && (
                        <div className="flex justify-between text-xs text-brown-400">
                            <span>Available</span>
                            <button onClick={() => setAmount(maxBTC)} className="text-orange-400 hover:underline font-mono">{maxBTC} BTC</button>
                        </div>
                    )}
                </div>

                {amount && parseFloat(amount) > 0 && (
                    <div className="flex flex-col gap-2 border-t border-brown-700 pt-4">
                        <div className="flex justify-between text-xs">
                            <span className="text-brown-400">Amount (sats)</span>
                            <span className="font-mono">{Math.floor(parseFloat(amount) * 1e8).toLocaleString()}</span>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading || !amount || parseFloat(amount || '0') <= 0}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${config.color}`}
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Processing...
                        </div>
                    ) : config.buttonText}
                </button>

                {txResult && (
                    <div className={`p-3 rounded-xl text-xs font-mono ${txResult.startsWith('Error') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                        {txResult}
                    </div>
                )}
            </div>
        </div>
    );
}
