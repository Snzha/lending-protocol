'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useWallet } from './WalletProviderWrapper';
import { getUserPosition, getMarkets, deposit, withdraw, borrow, repay } from '@/lib/opnet';
import type { MarketData, UserPosition, ActionType } from '@/types/lending';

interface PositionContextType {
    position: UserPosition;
    market: MarketData;
    loading: boolean;
    pendingTx: string | null;
    refresh: () => Promise<void>;
    executeAction: (action: ActionType, amountSats: bigint) => Promise<string>;
}

const EMPTY_POSITION: UserPosition = {
    deposited: '0',
    borrowed: '0',
    healthFactor: 99999,
    netWorth: '0',
    borrowLimit: '0',
};

const EMPTY_MARKET: MarketData = {
    asset: 'BTC',
    totalSupply: '0',
    totalBorrow: '0',
    supplyAPY: 5.0,
    borrowAPY: 8.0,
    utilization: 0,
};

const PositionContext = createContext<PositionContextType>({
    position: EMPTY_POSITION,
    market: EMPTY_MARKET,
    loading: false,
    pendingTx: null,
    refresh: async () => {},
    executeAction: async () => '',
});

export const usePositions = () => useContext(PositionContext);

export default function PositionProvider({ children }: { children: ReactNode }) {
    const { provider, network, publicKey, signer, walletAddress } = useWallet();
    const [position, setPosition] = useState<UserPosition>(EMPTY_POSITION);
    const [market, setMarket] = useState<MarketData>(EMPTY_MARKET);
    const [loading, setLoading] = useState(false);
    const [pendingTx, setPendingTx] = useState<string | null>(null);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    const config = {
        provider,
        network,
        publicKey: publicKey || undefined,
        signer,
        walletAddress: walletAddress || undefined,
    };

    /**
     * Refresh from contract — always use real on-chain data
     */
    const refresh = useCallback(async () => {
        if (!provider) return;
        setLoading(true);
        try {
            const [mkt, pos] = await Promise.all([
                getMarkets(config),
                publicKey ? getUserPosition(config, publicKey) : Promise.resolve(EMPTY_POSITION),
            ]);
            setMarket(mkt);
            setPosition(pos);
        } catch (err) {
            console.error('[PositionProvider] refresh error:', err);
        } finally {
            setLoading(false);
        }
    }, [provider, network, publicKey]);

    // Load on mount and when wallet changes
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Reset positions on disconnect
    useEffect(() => {
        if (!walletAddress) {
            setPosition(EMPTY_POSITION);
            setPendingTx(null);
        }
    }, [walletAddress]);

    /**
     * Poll contract until position changes (tx confirmed)
     */
    const pollForConfirmation = useCallback((expectedAction: ActionType, amount: number) => {
        // Clear any existing timer
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

        const prevDeposited = Number(position.deposited);
        const prevBorrowed = Number(position.borrowed);
        let attempts = 0;

        refreshTimerRef.current = setInterval(async () => {
            attempts++;
            if (attempts > 30) {
                // Give up after ~60 seconds
                if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
                setPendingTx(null);
                return;
            }

            try {
                if (!publicKey) return;
                const pos = await getUserPosition(config, publicKey);
                const newDep = Number(pos.deposited);
                const newBor = Number(pos.borrowed);

                // Check if on-chain state changed
                const changed =
                    (expectedAction === 'deposit' && newDep > prevDeposited) ||
                    (expectedAction === 'withdraw' && newDep < prevDeposited) ||
                    (expectedAction === 'borrow' && newBor > prevBorrowed) ||
                    (expectedAction === 'repay' && newBor < prevBorrowed);

                if (changed) {
                    // Tx confirmed! Update all data
                    setPosition(pos);
                    setPendingTx(null);
                    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
                    // Also refresh market totals
                    const mkt = await getMarkets(config);
                    setMarket(mkt);
                }
            } catch {
                // ignore polling errors
            }
        }, 2000);
    }, [config, publicKey, position]);

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        };
    }, []);

    const executeAction = useCallback(async (action: ActionType, amountSats: bigint): Promise<string> => {
        const actions = { deposit, withdraw, borrow, repay };

        // Send the transaction — this may throw if simulation or signing fails
        const result = await actions[action](config, amountSats);

        // Transaction was sent successfully — set pending state
        const txLabel = `${action} ${(Number(amountSats) / 1e8).toFixed(6)} BTC`;
        setPendingTx(txLabel);

        // Start polling for on-chain confirmation
        pollForConfirmation(action, Number(amountSats));

        return result;
    }, [config, pollForConfirmation]);

    return (
        <PositionContext.Provider value={{ position, market, loading, pendingTx, refresh, executeAction }}>
            {children}
        </PositionContext.Provider>
    );
}
