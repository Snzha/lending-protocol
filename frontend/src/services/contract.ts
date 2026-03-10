import { ABIDataTypes, BitcoinAbiTypes, getContract, type BaseContractProperties, type CallResult, type BitcoinInterfaceAbi } from 'opnet';
import { Address } from '@btc-vision/transaction';

export const LENDING_POOL_ABI: BitcoinInterfaceAbi = [
    // Write methods
    {
        name: 'deposit',
        inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'withdraw',
        inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'borrow',
        inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'repay',
        inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'liquidate',
        inputs: [{ name: 'user', type: ABIDataTypes.ADDRESS }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    // Read methods
    {
        name: 'getHealthFactor',
        constant: true,
        inputs: [{ name: 'user', type: ABIDataTypes.ADDRESS }],
        outputs: [{ name: 'healthFactor', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getUserDeposit',
        constant: true,
        inputs: [{ name: 'user', type: ABIDataTypes.ADDRESS }],
        outputs: [{ name: 'deposit', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getUserBorrow',
        constant: true,
        inputs: [{ name: 'user', type: ABIDataTypes.ADDRESS }],
        outputs: [{ name: 'borrow', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getTotalDeposits',
        constant: true,
        inputs: [],
        outputs: [{ name: 'totalDeposits', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getTotalBorrows',
        constant: true,
        inputs: [],
        outputs: [{ name: 'totalBorrows', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getInterestRate',
        constant: true,
        inputs: [],
        outputs: [{ name: 'interestRate', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
];

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
export const DEFAULT_FEE_RATE = 10;
export const MAX_SAT_PER_TX = BigInt(100000);

export interface ILendingPoolContract extends BaseContractProperties {
    deposit(amount: bigint): Promise<CallResult>;
    withdraw(amount: bigint): Promise<CallResult>;
    borrow(amount: bigint): Promise<CallResult>;
    repay(amount: bigint): Promise<CallResult>;
    liquidate(user: string): Promise<CallResult>;
    getHealthFactor(user: string): Promise<CallResult>;
    getUserDeposit(user: string): Promise<CallResult>;
    getUserBorrow(user: string): Promise<CallResult>;
    getTotalDeposits(): Promise<CallResult>;
    getTotalBorrows(): Promise<CallResult>;
    getInterestRate(): Promise<CallResult>;
}

export function getLendingPoolContract(
    provider: any,
    network: any,
    senderPublicKey?: string,
): ILendingPoolContract {
    if (!CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local');
    }

    let senderAddress: Address | undefined;
    if (senderPublicKey) {
        try {
            senderAddress = Address.fromString(senderPublicKey);
        } catch {
            senderAddress = undefined;
        }
    }

    return getContract<ILendingPoolContract>(
        CONTRACT_ADDRESS,
        LENDING_POOL_ABI,
        provider,
        network,
        senderAddress,
    );
}
