export interface MarketData {
    asset: string;
    totalSupply: string;  // in sats
    totalBorrow: string;  // in sats
    supplyAPY: number;    // percentage
    borrowAPY: number;    // percentage
    utilization: number;  // percentage
}

export interface UserPosition {
    deposited: string;    // in sats
    borrowed: string;     // in sats
    healthFactor: number; // scaled: 100 = 1.0x
    netWorth: string;     // in sats
    borrowLimit: string;  // in sats
}

export type ActionType = 'deposit' | 'withdraw' | 'borrow' | 'repay';
