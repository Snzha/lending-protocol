import { Address, AddressMap, ExtendedAddressMap, SchnorrSignature } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the deposit function call.
 */
export type Deposit = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the withdraw function call.
 */
export type Withdraw = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the borrow function call.
 */
export type Borrow = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the repay function call.
 */
export type Repay = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the liquidate function call.
 */
export type Liquidate = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getHealthFactor function call.
 */
export type GetHealthFactor = CallResult<
    {
        healthFactor: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getUserDeposit function call.
 */
export type GetUserDeposit = CallResult<
    {
        deposit: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getUserBorrow function call.
 */
export type GetUserBorrow = CallResult<
    {
        borrow: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getTotalDeposits function call.
 */
export type GetTotalDeposits = CallResult<
    {
        totalDeposits: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getTotalBorrows function call.
 */
export type GetTotalBorrows = CallResult<
    {
        totalBorrows: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getInterestRate function call.
 */
export type GetInterestRate = CallResult<
    {
        interestRate: bigint;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// ILendingPool
// ------------------------------------------------------------------
export interface ILendingPool extends IOP_NETContract {
    deposit(amount: bigint): Promise<Deposit>;
    withdraw(amount: bigint): Promise<Withdraw>;
    borrow(amount: bigint): Promise<Borrow>;
    repay(amount: bigint): Promise<Repay>;
    liquidate(user: Address): Promise<Liquidate>;
    getHealthFactor(user: Address): Promise<GetHealthFactor>;
    getUserDeposit(user: Address): Promise<GetUserDeposit>;
    getUserBorrow(user: Address): Promise<GetUserBorrow>;
    getTotalDeposits(): Promise<GetTotalDeposits>;
    getTotalBorrows(): Promise<GetTotalBorrows>;
    getInterestRate(): Promise<GetInterestRate>;
}
