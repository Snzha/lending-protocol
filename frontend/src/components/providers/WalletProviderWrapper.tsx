'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { JSONRpcProvider } from 'opnet';
import type { OPNetSigner } from '@/services/wallet';

interface WalletContextType {
    walletAddress: string | null;
    publicKey: string | null;
    balance: number;
    provider: JSONRpcProvider | null;
    signer: OPNetSigner | null;
    network: any;
    connecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet(): WalletContextType {
    const ctx = useContext(WalletContext);
    if (!ctx) {
        throw new Error('useWallet must be used within WalletProviderWrapper');
    }
    return ctx;
}

export default function WalletProviderWrapper({ children }: { children: React.ReactNode }) {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [balance, setBalance] = useState<number>(0);
    const [provider, setProvider] = useState<JSONRpcProvider | null>(null);
    const [signer, setSigner] = useState<OPNetSigner | null>(null);
    const [network, setNetwork] = useState<any>(null);
    const [connecting, setConnecting] = useState(false);

    // Dynamic import to avoid SSR issues with window access
    const getWalletModule = useCallback(async () => {
        return await import('@/services/wallet');
    }, []);

    const refreshBalance = useCallback(async () => {
        if (!walletAddress) return;
        try {
            const wallet = await getWalletModule();
            const bal = await wallet.getBalance();
            setBalance(bal);
        } catch {
            // ignore
        }
    }, [walletAddress, getWalletModule]);

    // Check for existing connection on mount
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const wallet = await getWalletModule();
                if (!wallet.isWalletAvailable()) return;

                const accounts = await wallet.getWalletProvider()?.getAccounts();
                if (accounts && accounts.length > 0) {
                    setWalletAddress(accounts[0]);

                    const pk = await wallet.getPublicKey();
                    setPublicKey(pk);

                    const prov = wallet.createProvider();
                    setProvider(prov);

                    setNetwork(wallet.getBitcoinNetwork());

                    const bal = await wallet.getBalance();
                    setBalance(bal);

                    try {
                        const s = await wallet.createSigner();
                        setSigner(s);
                        console.log('[Wallet] Signer created successfully on reconnect');
                    } catch (e) {
                        console.warn('[Wallet] Could not create signer on reconnect:', e);
                    }
                }
            } catch (e) {
                console.warn('[Wallet] Auto-reconnect failed:', e);
            }
        };
        checkConnection();
    }, [getWalletModule]);

    const connect = useCallback(async () => {
        setConnecting(true);
        try {
            const wallet = await getWalletModule();
            const { address, publicKey: pubKey } = await wallet.connectWallet();

            setWalletAddress(address);
            setPublicKey(pubKey);

            const prov = wallet.createProvider();
            setProvider(prov);

            setNetwork(wallet.getBitcoinNetwork());

            const bal = await wallet.getBalance();
            setBalance(bal);

            try {
                const s = await wallet.createSigner();
                setSigner(s);
                console.log('[Wallet] Signer created successfully:', s);
            } catch (e) {
                console.error('[Wallet] Signer creation failed:', e);
            }
        } catch (err: any) {
            console.error('[Wallet] Connection failed:', err);
            alert(err?.message || 'Failed to connect wallet');
        } finally {
            setConnecting(false);
        }
    }, [getWalletModule]);

    const disconnect = useCallback(() => {
        setWalletAddress(null);
        setPublicKey(null);
        setBalance(0);
        setSigner(null);
        setProvider(null);
        setNetwork(null);
    }, []);

    return (
        <WalletContext.Provider
            value={{
                walletAddress,
                publicKey,
                balance,
                provider,
                signer,
                network,
                connecting,
                connect,
                disconnect,
                refreshBalance,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}
