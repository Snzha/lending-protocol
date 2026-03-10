/**
 * lib/opnet.ts — High-level library for interacting with the LendingPool contract.
 */

import { getLendingPoolContract, CONTRACT_ADDRESS, DEFAULT_FEE_RATE, MAX_SAT_PER_TX } from '@/services/contract';
import type { MarketData, UserPosition } from '@/types/lending';

interface OpnetConfig {
    provider: any;
    network: any;
    publicKey?: string;
    signer?: any;
    walletAddress?: string;
}

function getContract(config: OpnetConfig) {
    return getLendingPoolContract(config.provider, config.network, config.publicKey);
}

async function sendTx(config: OpnetConfig, simulation: any) {
    if (!config.signer) {
        throw new Error('Wallet signer not available. Please disconnect and reconnect your wallet.');
    }
    const txParams: any = {
        signer: config.signer,
        refundTo: config.walletAddress,
        maximumAllowedSatToSpend: MAX_SAT_PER_TX,
        feeRate: DEFAULT_FEE_RATE,
        network: config.network,
    };
    return await simulation.sendTransaction(txParams);
}

/** Get market overview data */
export async function getMarkets(config: OpnetConfig): Promise<MarketData> {
    if (!CONTRACT_ADDRESS) {
        return {
            asset: 'BTC',
            totalSupply: '0',
            totalBorrow: '0',
            supplyAPY: 5.0,
            borrowAPY: 8.0,
            utilization: 0,
        };
    }

    try {
        const contract = getContract(config);
        const [deposits, borrows, rate] = await Promise.all([
            contract.getTotalDeposits(),
            contract.getTotalBorrows(),
            contract.getInterestRate(),
        ]);

        const dProps = deposits?.properties as any;
        const bProps = borrows?.properties as any;
        const rProps = rate?.properties as any;
        const totalSupply = dProps?.totalDeposits?.toString() || '0';
        const totalBorrow = bProps?.totalBorrows?.toString() || '0';
        const interestRate = Number(rProps?.interestRate?.toString() || '500');

        const supplyNum = Number(totalSupply);
        const borrowNum = Number(totalBorrow);
        const utilization = supplyNum > 0 ? (borrowNum / supplyNum) * 100 : 0;

        return {
            asset: 'BTC',
            totalSupply,
            totalBorrow,
            supplyAPY: interestRate / 100,
            borrowAPY: (interestRate / 100) * 1.6,
            utilization,
        };
    } catch (err) {
        console.error('getMarkets error:', err);
        return { asset: 'BTC', totalSupply: '0', totalBorrow: '0', supplyAPY: 5.0, borrowAPY: 8.0, utilization: 0 };
    }
}

/** Get user position */
export async function getUserPosition(config: OpnetConfig, userAddress: string): Promise<UserPosition> {
    if (!CONTRACT_ADDRESS || !userAddress) {
        return { deposited: '0', borrowed: '0', healthFactor: 0, netWorth: '0', borrowLimit: '0' };
    }

    try {
        const contract = getContract(config);
        const [dep, bor, hf] = await Promise.all([
            contract.getUserDeposit(userAddress),
            contract.getUserBorrow(userAddress),
            contract.getHealthFactor(userAddress),
        ]);

        const depProps = dep?.properties as any;
        const borProps = bor?.properties as any;
        const hfProps = hf?.properties as any;
        const deposited = depProps?.deposit?.toString() || '0';
        const borrowed = borProps?.borrow?.toString() || '0';
        const healthRaw = Number(hfProps?.healthFactor?.toString() || '99999');

        const depNum = Number(deposited);
        const borNum = Number(borrowed);
        const netWorth = Math.floor(depNum - borNum).toString();
        const borrowLimit = Math.floor(depNum * 66 / 100).toString();

        return { deposited, borrowed, healthFactor: healthRaw, netWorth, borrowLimit };
    } catch (err) {
        console.error('getUserPosition error:', err);
        return { deposited: '0', borrowed: '0', healthFactor: 0, netWorth: '0', borrowLimit: '0' };
    }
}

/** Deposit BTC into the lending pool */
export async function deposit(config: OpnetConfig, amountSats: bigint): Promise<string> {
    const contract = getContract(config);
    const simulation = await contract.deposit(amountSats);
    if ('revert' in simulation && (simulation as any).revert) {
        throw new Error((simulation as any).revert);
    }
    const tx = await sendTx(config, simulation);
    return tx?.transactionId || tx?.toString() || 'sent';
}

/** Withdraw BTC from the lending pool */
export async function withdraw(config: OpnetConfig, amountSats: bigint): Promise<string> {
    const contract = getContract(config);
    const simulation = await contract.withdraw(amountSats);
    if ('revert' in simulation && (simulation as any).revert) {
        throw new Error((simulation as any).revert);
    }
    const tx = await sendTx(config, simulation);
    return tx?.transactionId || tx?.toString() || 'sent';
}

/** Borrow BTC from the lending pool */
export async function borrow(config: OpnetConfig, amountSats: bigint): Promise<string> {
    const contract = getContract(config);
    const simulation = await contract.borrow(amountSats);
    if ('revert' in simulation && (simulation as any).revert) {
        throw new Error((simulation as any).revert);
    }
    const tx = await sendTx(config, simulation);
    return tx?.transactionId || tx?.toString() || 'sent';
}

/** Repay borrowed BTC */
export async function repay(config: OpnetConfig, amountSats: bigint): Promise<string> {
    const contract = getContract(config);
    const simulation = await contract.repay(amountSats);
    if ('revert' in simulation && (simulation as any).revert) {
        throw new Error((simulation as any).revert);
    }
    const tx = await sendTx(config, simulation);
    return tx?.transactionId || tx?.toString() || 'sent';
}
