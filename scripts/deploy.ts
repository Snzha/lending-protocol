/**
 * Deploy script for LendingPool contract.
 *
 * Usage:
 *   npm run deploy
 *
 * This script:
 * 1. Builds the contract to WebAssembly
 * 2. Outputs the .wasm file path for deployment via OP Wallet
 *
 * To deploy to OP_NET Testnet:
 * 1. Open OP Wallet browser extension
 * 2. Go to "Deploy Contract"
 * 3. Select the .wasm file from contracts/build/LendingPool.wasm
 * 4. Confirm the deployment transaction
 * 5. Copy the contract address and set NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env.local
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const CONTRACTS_DIR = resolve(__dirname, '..', 'contracts');
const WASM_PATH = resolve(CONTRACTS_DIR, 'build', 'LendingPool.wasm');

console.log('='.repeat(60));
console.log('  BTCLend — LendingPool Contract Deployment');
console.log('='.repeat(60));
console.log();

// Step 1: Install dependencies
console.log('[1/3] Installing contract dependencies...');
try {
    execSync('npm install', { cwd: CONTRACTS_DIR, stdio: 'pipe' });
    console.log('      Dependencies installed.');
} catch (err) {
    console.error('      Failed to install dependencies.');
    process.exit(1);
}

// Step 2: Build contract
console.log('[2/3] Building LendingPool contract...');
try {
    execSync('npm run build', { cwd: CONTRACTS_DIR, stdio: 'inherit' });
    console.log();
} catch (err) {
    console.error('      Build failed.');
    process.exit(1);
}

// Step 3: Output result
if (existsSync(WASM_PATH)) {
    console.log('[3/3] Contract built successfully!');
    console.log();
    console.log('  WASM file: ' + WASM_PATH);
    console.log();
    console.log('  Next steps:');
    console.log('  1. Open OP Wallet extension');
    console.log('  2. Deploy the .wasm file above to OP_NET Testnet');
    console.log('  3. Copy the contract address');
    console.log('  4. Set it in frontend/.env.local:');
    console.log('     NEXT_PUBLIC_CONTRACT_ADDRESS=<your_address>');
    console.log();
    console.log('='.repeat(60));
} else {
    console.error('  ERROR: WASM file not found at ' + WASM_PATH);
    process.exit(1);
}
