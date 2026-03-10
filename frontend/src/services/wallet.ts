'use client';

import { UnisatSigner } from '@btc-vision/transaction';
import { networks } from '@btc-vision/bitcoin';
import { JSONRpcProvider } from 'opnet';

/**
 * Custom signer that uses OP Wallet (window.opnet) instead of UniSat (window.unisat).
 * OP Wallet implements the same Unisat interface, so we just override the getter.
 */
export class OPNetSigner extends UnisatSigner {
    get unisat(): any {
        if (typeof window === 'undefined') {
            throw new Error('Window not found');
        }
        const module = (window as any).opnet || (window as any).unisat;
        if (!module) {
            throw new Error('OP Wallet extension not found. Install it from the Chrome Web Store.');
        }
        return module;
    }
}

/**
 * Get the OP Wallet object from window.
 */
export function getWalletProvider(): any | null {
    if (typeof window === 'undefined') return null;
    return (window as any).opnet || (window as any).unisat || null;
}

export function isWalletAvailable(): boolean {
    return !!getWalletProvider();
}

/**
 * Get public key from wallet.
 */
export async function getPublicKey(): Promise<string | null> {
    const wallet = getWalletProvider();
    if (!wallet) return null;
    try {
        return await wallet.getPublicKey();
    } catch {
        return null;
    }
}

/**
 * Connect to OP Wallet and return address + publicKey.
 */
export async function connectWallet(): Promise<{
    address: string;
    publicKey: string;
    chain: any;
}> {
    const wallet = getWalletProvider();
    if (!wallet) {
        throw new Error('OP Wallet not found. Install it from the Chrome Web Store.');
    }

    const result = await wallet.requestAccounts();
    if (!result || result.length === 0) {
        throw new Error('User rejected the connection request.');
    }

    const address = result[0];
    const pubKey = await wallet.getPublicKey();
    const chain = await wallet.getChain();

    return { address, publicKey: pubKey, chain };
}

/**
 * Get wallet balance.
 */
export async function getBalance(): Promise<number> {
    const wallet = getWalletProvider();
    if (!wallet) return 0;
    try {
        const balance = await wallet.getBalance();
        return balance?.total || 0;
    } catch {
        return 0;
    }
}

/**
 * Create a JSONRpcProvider for OP_NET.
 */
export function createProvider(): JSONRpcProvider {
    const rpcUrl = process.env.NEXT_PUBLIC_OPNET_RPC_URL || 'https://testnet.opnet.org';
    return new JSONRpcProvider({ url: rpcUrl, network: networks.testnet } as any);
}

/**
 * Get the bitcoinjs-lib Network object.
 */
export function getBitcoinNetwork(): any {
    return networks.testnet;
}

/**
 * Create and initialize a signer for OP Wallet.
 * This signer wraps window.opnet and provides getPublicKeyInfo() needed by sendTransaction().
 */
export async function createSigner(): Promise<OPNetSigner> {
    const signer = new OPNetSigner();
    await signer.init();
    return signer;
}
