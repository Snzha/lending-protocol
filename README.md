# BTCLend — Bitcoin L1 Lending Protocol

An Aave-like lending protocol built on Bitcoin L1 using the OP_NET metaprotocol.

## Features

- **Deposit** BTC as collateral and earn supply APY
- **Borrow** BTC against your collateral (up to 66% LTV)
- **Repay** loans at any time
- **Withdraw** collateral (if health factor allows)
- **Liquidation** of undercollateralized positions (health factor < 1.0x)
- **150% collateral factor** with simple linear interest

## Project Structure

```
bitcoin-lending-protocol/
├── contracts/         # OP_NET smart contract (AssemblyScript)
│   ├── src/           # LendingPool contract source
│   └── build/         # Compiled .wasm output
├── frontend/          # Next.js web application
│   ├── src/app/       # Pages (markets, profile)
│   ├── src/components/# UI components (Navbar, ActionModal)
│   ├── src/lib/       # opnet.ts — contract interaction library
│   └── src/services/  # Wallet & contract ABI definitions
├── scripts/           # Deployment script
├── package.json       # Root package with workspace scripts
└── netlify.toml       # Netlify deployment config
```

## Quick Start

```bash
# Install all dependencies (contracts + frontend)
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Smart Contract

```bash
# Build the contract
npm run build:contracts

# Deploy (builds + outputs instructions)
npm run deploy
```

Deploy the generated `contracts/build/LendingPool.wasm` via OP Wallet, then set the contract address:

```bash
# frontend/.env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_deployed_address>
NEXT_PUBLIC_OPNET_RPC_URL=https://testnet.opnet.org
```

## Contract Functions

| Function | Description |
|---|---|
| `deposit(amount)` | Deposit BTC collateral |
| `withdraw(amount)` | Withdraw collateral |
| `borrow(amount)` | Borrow BTC against collateral |
| `repay(amount)` | Repay outstanding loan |
| `getHealthFactor(user)` | Check user's health factor |
| `liquidate(user)` | Liquidate undercollateralized position |
| `getTotalDeposits()` | Total BTC deposited |
| `getTotalBorrows()` | Total BTC borrowed |
| `getInterestRate()` | Current interest rate (basis points) |

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **Blockchain**: OP_NET (Bitcoin L1 metaprotocol)
- **Smart Contract**: AssemblyScript → WebAssembly
- **Wallet**: OP Wallet (Chrome extension)
