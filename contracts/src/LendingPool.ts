import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    OP_NET,
    Blockchain,
    Address,
    Calldata,
    BytesWriter,
    StoredU256,
    StoredU256Array,
    StoredAddressArray,
    SafeMath,
    Revert,
    EMPTY_POINTER,
} from '@btc-vision/btc-runtime/runtime';

// Constants (scaled by 100 for integer math)
const COLLATERAL_FACTOR: u256 = u256.fromU64(150);   // 150% collateral required
const BORROW_FACTOR: u256 = u256.fromU64(66);        // can borrow up to 66% of collateral
const HEALTH_SCALE: u256 = u256.fromU64(10000);      // scale factor for health factor
const HUNDRED: u256 = u256.fromU64(100);
const ZERO: u256 = u256.Zero;
const ONE: u256 = u256.One;

@final
export class LendingPool extends OP_NET {
    // ====== Storage Pointers ======
    private totalDepositsPointer: u16 = Blockchain.nextPointer;
    private totalBorrowsPointer: u16 = Blockchain.nextPointer;
    private interestRatePointer: u16 = Blockchain.nextPointer;
    private depositorCountPointer: u16 = Blockchain.nextPointer;
    private borrowerCountPointer: u16 = Blockchain.nextPointer;
    private depositorAddressesPointer: u16 = Blockchain.nextPointer;
    private depositorAmountsPointer: u16 = Blockchain.nextPointer;
    private borrowerAddressesPointer: u16 = Blockchain.nextPointer;
    private borrowerAmountsPointer: u16 = Blockchain.nextPointer;

    // ====== Eager Scalar Storage ======
    private totalDepositsStore: StoredU256 = new StoredU256(this.totalDepositsPointer, EMPTY_POINTER);
    private totalBorrowsStore: StoredU256 = new StoredU256(this.totalBorrowsPointer, EMPTY_POINTER);
    private interestRateStore: StoredU256 = new StoredU256(this.interestRatePointer, EMPTY_POINTER);
    private depositorCountStore: StoredU256 = new StoredU256(this.depositorCountPointer, EMPTY_POINTER);
    private borrowerCountStore: StoredU256 = new StoredU256(this.borrowerCountPointer, EMPTY_POINTER);

    // ====== Lazy Initialized Arrays ======
    private _depositorAddresses: StoredAddressArray | null = null;
    private get depositorAddresses(): StoredAddressArray {
        if (this._depositorAddresses === null) this._depositorAddresses = new StoredAddressArray(this.depositorAddressesPointer, EMPTY_POINTER);
        return this._depositorAddresses as StoredAddressArray;
    }

    private _depositorAmounts: StoredU256Array | null = null;
    private get depositorAmounts(): StoredU256Array {
        if (this._depositorAmounts === null) this._depositorAmounts = new StoredU256Array(this.depositorAmountsPointer, EMPTY_POINTER);
        return this._depositorAmounts as StoredU256Array;
    }

    private _borrowerAddresses: StoredAddressArray | null = null;
    private get borrowerAddresses(): StoredAddressArray {
        if (this._borrowerAddresses === null) this._borrowerAddresses = new StoredAddressArray(this.borrowerAddressesPointer, EMPTY_POINTER);
        return this._borrowerAddresses as StoredAddressArray;
    }

    private _borrowerAmounts: StoredU256Array | null = null;
    private get borrowerAmounts(): StoredU256Array {
        if (this._borrowerAmounts === null) this._borrowerAmounts = new StoredU256Array(this.borrowerAmountsPointer, EMPTY_POINTER);
        return this._borrowerAmounts as StoredU256Array;
    }

    public constructor() {
        super();
    }

    public override onDeployment(_calldata: Calldata): void {
        this.totalDepositsStore.value = ZERO;
        this.totalBorrowsStore.value = ZERO;
        this.interestRateStore.value = u256.fromU64(500); // 5.00% APY in basis points
        this.depositorCountStore.value = ZERO;
        this.borrowerCountStore.value = ZERO;
    }

    // ====== Write Methods ======

    @method(
        { name: 'amount', type: ABIDataTypes.UINT256 },
    )
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public deposit(calldata: Calldata): BytesWriter {
        const amount = calldata.readU256();
        if (amount == ZERO) throw new Revert('Amount must be > 0');

        const sender = Blockchain.tx.sender;
        const count = this.depositorCountStore.value.toI32();
        const idx = this.findAddressIndex(this.depositorAddresses, count, sender);

        if (idx == -1) {
            // New depositor
            this.depositorAddresses.push(sender);
            this.depositorAmounts.push(amount);
            this.depositorCountStore.value = SafeMath.add(this.depositorCountStore.value, ONE);
        } else {
            // Existing depositor - add to balance
            const current = this.depositorAmounts.get(idx);
            this.depositorAmounts.set(idx, SafeMath.add(current, amount));
        }

        this.totalDepositsStore.value = SafeMath.add(this.totalDepositsStore.value, amount);

        this.depositorAddresses.save();
        this.depositorAmounts.save();

        const writer = new BytesWriter(1);
        writer.writeBoolean(true);
        return writer;
    }

    @method(
        { name: 'amount', type: ABIDataTypes.UINT256 },
    )
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public withdraw(calldata: Calldata): BytesWriter {
        const amount = calldata.readU256();
        if (amount == ZERO) throw new Revert('Amount must be > 0');

        const sender = Blockchain.tx.sender;
        const depCount = this.depositorCountStore.value.toI32();
        const depIdx = this.findAddressIndex(this.depositorAddresses, depCount, sender);

        if (depIdx == -1) throw new Revert('No deposits found');

        const currentDeposit = this.depositorAmounts.get(depIdx);
        if (u256.gt(amount, currentDeposit)) throw new Revert('Insufficient deposit balance');

        const newDeposit = SafeMath.sub(currentDeposit, amount);

        // Check health factor after withdrawal
        const borCount = this.borrowerCountStore.value.toI32();
        const borIdx = this.findAddressIndex(this.borrowerAddresses, borCount, sender);
        if (borIdx != -1) {
            const borrowed = this.borrowerAmounts.get(borIdx);
            if (u256.gt(borrowed, ZERO)) {
                // borrowLimit = newDeposit * 66 / 100
                const borrowLimit = SafeMath.div(SafeMath.mul(newDeposit, BORROW_FACTOR), HUNDRED);
                if (u256.gt(borrowed, borrowLimit)) throw new Revert('Withdrawal would undercollateralize position');
            }
        }

        this.depositorAmounts.set(depIdx, newDeposit);
        this.totalDepositsStore.value = SafeMath.sub(this.totalDepositsStore.value, amount);

        this.depositorAmounts.save();

        const writer = new BytesWriter(1);
        writer.writeBoolean(true);
        return writer;
    }

    @method(
        { name: 'amount', type: ABIDataTypes.UINT256 },
    )
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public borrow(calldata: Calldata): BytesWriter {
        const amount = calldata.readU256();
        if (amount == ZERO) throw new Revert('Amount must be > 0');

        const sender = Blockchain.tx.sender;

        // Check collateral
        const depCount = this.depositorCountStore.value.toI32();
        const depIdx = this.findAddressIndex(this.depositorAddresses, depCount, sender);
        if (depIdx == -1) throw new Revert('No collateral deposited');

        const collateral = this.depositorAmounts.get(depIdx);
        // borrowLimit = collateral * 66 / 100
        const borrowLimit = SafeMath.div(SafeMath.mul(collateral, BORROW_FACTOR), HUNDRED);

        // Get existing borrow
        const borCount = this.borrowerCountStore.value.toI32();
        const borIdx = this.findAddressIndex(this.borrowerAddresses, borCount, sender);

        let currentBorrow = ZERO;
        if (borIdx != -1) {
            currentBorrow = this.borrowerAmounts.get(borIdx);
        }

        const newBorrow = SafeMath.add(currentBorrow, amount);
        if (u256.gt(newBorrow, borrowLimit)) throw new Revert('Exceeds borrow limit');

        if (borIdx == -1) {
            // New borrower
            this.borrowerAddresses.push(sender);
            this.borrowerAmounts.push(amount);
            this.borrowerCountStore.value = SafeMath.add(this.borrowerCountStore.value, ONE);
        } else {
            this.borrowerAmounts.set(borIdx, newBorrow);
        }

        this.totalBorrowsStore.value = SafeMath.add(this.totalBorrowsStore.value, amount);

        this.borrowerAddresses.save();
        this.borrowerAmounts.save();

        const writer = new BytesWriter(1);
        writer.writeBoolean(true);
        return writer;
    }

    @method(
        { name: 'amount', type: ABIDataTypes.UINT256 },
    )
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public repay(calldata: Calldata): BytesWriter {
        const amount = calldata.readU256();
        if (amount == ZERO) throw new Revert('Amount must be > 0');

        const sender = Blockchain.tx.sender;
        const borCount = this.borrowerCountStore.value.toI32();
        const borIdx = this.findAddressIndex(this.borrowerAddresses, borCount, sender);

        if (borIdx == -1) throw new Revert('No outstanding borrows');

        const currentBorrow = this.borrowerAmounts.get(borIdx);
        if (currentBorrow == ZERO) throw new Revert('No outstanding borrows');

        // Repay min(amount, currentBorrow)
        let repayAmount = amount;
        if (u256.gt(amount, currentBorrow)) {
            repayAmount = currentBorrow;
        }

        this.borrowerAmounts.set(borIdx, SafeMath.sub(currentBorrow, repayAmount));
        this.totalBorrowsStore.value = SafeMath.sub(this.totalBorrowsStore.value, repayAmount);

        this.borrowerAmounts.save();

        const writer = new BytesWriter(1);
        writer.writeBoolean(true);
        return writer;
    }

    @method(
        { name: 'user', type: ABIDataTypes.ADDRESS },
    )
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public liquidate(calldata: Calldata): BytesWriter {
        const user = calldata.readAddress();

        const depCount = this.depositorCountStore.value.toI32();
        const borCount = this.borrowerCountStore.value.toI32();
        const depIdx = this.findAddressIndex(this.depositorAddresses, depCount, user);
        const borIdx = this.findAddressIndex(this.borrowerAddresses, borCount, user);

        if (depIdx == -1 || borIdx == -1) throw new Revert('User position not found');

        const collateral = this.depositorAmounts.get(depIdx);
        const borrowed = this.borrowerAmounts.get(borIdx);

        if (borrowed == ZERO) throw new Revert('No borrows to liquidate');

        // healthFactor = collateral * 10000 / (borrowed * 150)
        const numerator = SafeMath.mul(collateral, HEALTH_SCALE);
        const denominator = SafeMath.mul(borrowed, COLLATERAL_FACTOR);
        const healthFactor = SafeMath.div(numerator, denominator);

        // If healthFactor >= 100 (i.e. >= 1.0), position is healthy
        if (u256.ge(healthFactor, HUNDRED)) throw new Revert('Position is healthy');

        // Liquidate: clear both positions
        this.depositorAmounts.set(depIdx, ZERO);
        this.borrowerAmounts.set(borIdx, ZERO);
        this.totalDepositsStore.value = SafeMath.sub(this.totalDepositsStore.value, collateral);
        this.totalBorrowsStore.value = SafeMath.sub(this.totalBorrowsStore.value, borrowed);

        this.depositorAmounts.save();
        this.borrowerAmounts.save();

        const writer = new BytesWriter(1);
        writer.writeBoolean(true);
        return writer;
    }

    // ====== Read Methods ======

    @method(
        { name: 'user', type: ABIDataTypes.ADDRESS },
    )
    @returns({ name: 'healthFactor', type: ABIDataTypes.UINT256 })
    public getHealthFactor(calldata: Calldata): BytesWriter {
        const user = calldata.readAddress();

        const depCount = this.depositorCountStore.value.toI32();
        const borCount = this.borrowerCountStore.value.toI32();
        const depIdx = this.findAddressIndex(this.depositorAddresses, depCount, user);
        const borIdx = this.findAddressIndex(this.borrowerAddresses, borCount, user);

        let collateral = ZERO;
        let borrowed = ZERO;

        if (depIdx != -1) collateral = this.depositorAmounts.get(depIdx);
        if (borIdx != -1) borrowed = this.borrowerAmounts.get(borIdx);

        let healthFactor: u256;
        if (borrowed == ZERO) {
            // No borrows = infinite health, return max
            healthFactor = u256.fromU64(99999);
        } else {
            // healthFactor = collateral * 10000 / (borrowed * 150)
            // Result: 100 = 1.0x, 150 = 1.5x, etc.
            const numerator = SafeMath.mul(collateral, HEALTH_SCALE);
            const denominator = SafeMath.mul(borrowed, COLLATERAL_FACTOR);
            healthFactor = SafeMath.div(numerator, denominator);
        }

        const writer = new BytesWriter(32);
        writer.writeU256(healthFactor);
        return writer;
    }

    @method(
        { name: 'user', type: ABIDataTypes.ADDRESS },
    )
    @returns({ name: 'deposit', type: ABIDataTypes.UINT256 })
    public getUserDeposit(calldata: Calldata): BytesWriter {
        const user = calldata.readAddress();
        const count = this.depositorCountStore.value.toI32();
        const idx = this.findAddressIndex(this.depositorAddresses, count, user);

        const amount = idx == -1 ? ZERO : this.depositorAmounts.get(idx);

        const writer = new BytesWriter(32);
        writer.writeU256(amount);
        return writer;
    }

    @method(
        { name: 'user', type: ABIDataTypes.ADDRESS },
    )
    @returns({ name: 'borrow', type: ABIDataTypes.UINT256 })
    public getUserBorrow(calldata: Calldata): BytesWriter {
        const user = calldata.readAddress();
        const count = this.borrowerCountStore.value.toI32();
        const idx = this.findAddressIndex(this.borrowerAddresses, count, user);

        const amount = idx == -1 ? ZERO : this.borrowerAmounts.get(idx);

        const writer = new BytesWriter(32);
        writer.writeU256(amount);
        return writer;
    }

    @method()
    @returns({ name: 'totalDeposits', type: ABIDataTypes.UINT256 })
    public getTotalDeposits(calldata: Calldata): BytesWriter {
        const writer = new BytesWriter(32);
        writer.writeU256(this.totalDepositsStore.value);
        return writer;
    }

    @method()
    @returns({ name: 'totalBorrows', type: ABIDataTypes.UINT256 })
    public getTotalBorrows(calldata: Calldata): BytesWriter {
        const writer = new BytesWriter(32);
        writer.writeU256(this.totalBorrowsStore.value);
        return writer;
    }

    @method()
    @returns({ name: 'interestRate', type: ABIDataTypes.UINT256 })
    public getInterestRate(calldata: Calldata): BytesWriter {
        const writer = new BytesWriter(32);
        writer.writeU256(this.interestRateStore.value);
        return writer;
    }

    // ====== Helpers ======

    private findAddressIndex(addresses: StoredAddressArray, count: i32, target: Address): i32 {
        for (let i: i32 = 0; i < count; i++) {
            if (addresses.get(i).equals(target)) {
                return i;
            }
        }
        return -1;
    }
}
