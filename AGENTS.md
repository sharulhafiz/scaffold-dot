# AGENTS.md

This file provides guidelines for agentic coding agents working in Scaffold-DOT.

## Build/Lint/Test Commands

### Core Commands
- `yarn test` - Run all Hardhat tests (uses --network hardhat)
- `yarn compile` - Compile Solidity contracts with resolc (PolkaVM compiler)
- `yarn deploy` - Deploy contracts using Hardhat Ignition (generates ABIs for frontend)
- `yarn start` - Start NextJS frontend (http://localhost:3000)
- `yarn chain` - Start local Substrate node (revive-dev-node)
- `yarn rpc` - Start eth-rpc adapter server

### Running Single Tests
- `npx hardhat test packages/hardhat/test/YourContract.ts` - Run specific test file
- `npx hardhat test --grep "pattern"` - Run tests matching pattern
- Use `it.only()` or `describe.only()` in test code to isolate tests during debugging

### Quality Assurance
- `yarn lint` - Lint both packages
- `yarn format` - Format all code with Prettier
- `yarn hardhat:check-types` - Type-check Hardhat package
- `yarn next:check-types` - Type-check NextJS package

### Docker Commands
- Always use `docker compose` (V2 syntax with space) - NOT `docker-compose` (V1 with hyphen)
- Example: `docker compose up -d --build`

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled in both packages
- Hardhat: CommonJS modules, es2020 target
- NextJS: ES modules, bundler resolution, Next.js App Router

### Import Ordering (NextJS)
1. `"use client";` directive at top (if client component)
2. React/Next.js imports: `import { useEffect } from "react";`
3. Third-party libraries: wagmi, viem, @tanstack/react-query
4. Internal project imports using `~~/` alias: `import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";`
5. Local relative imports: `import { SubComponent } from "./SubComponent";`

### Naming Conventions
- **Components**: PascalCase (e.g., `Address`, `ContractUI`)
- **Hooks**: camelCase with `use` prefix (e.g., `useScaffoldReadContract`, `useTransactor`)
- **Variables/Functions**: camelCase (e.g., `checkSumAddress`, `writeContractAsync`)
- **Types**: PascalCase, prefer `type` over `interface` (e.g., `AddressProps`, `ContractName`)
- **Props**: `[ComponentName]Props` pattern (e.g., `AddressProps`, `ContractUIProps`)
- **Constants**: camelCase with `as const` for maps, SCREAMING_SNAKE_CASE for paths (scripts only)

### Formatting Rules (Prettier)
- Print width: 120 characters
- Tab width: 2 spaces (TypeScript/TSX), 4 spaces (Solidity)
- Trailing commas: all
- Arrow parentheses: avoid
- NextJS uses `@trivago/prettier-plugin-sort-imports` for automatic import sorting

### Component Structure
1. `"use client";` directive
2. Imports (ordered as above)
3. Internal type definitions and constants
4. Props type definition
5. Component export (named constant)
6. Hooks invoked at top of component body
7. Conditional early returns for loading/error states
8. Main JSX return

### Error Handling
- **Frontend**: Early returns with error states (e.g., `<span className="text-error">Wrong address</span>`)
- **Async operations**: Wrap in try-catch with user-friendly notifications via `notification.error()`
- **Contract writes**: Validate contract deployment, wallet connection, and network before transactions

### Testing Patterns (Hardhat)
- Use TypeChain types: `import { YourContract } from '../typechain-types'`
- Nested describe blocks: Contract → Function → Scenario
- beforeEach for fresh deployments per test
- Helpers defined at top level: `const toWei = (value: string) => hre.ethers.parseEther(value);`
- Assertions: `expect(await contract.method()).to.equal(expected)`
- Events: `expect(tx).to.emit(contract, "Event").withArgs(...)`
- Reverts: `expect(tx).to.be.revertedWith("Error Message")`

## Critical Rules

### Smart Contract Interactions
- **ALWAYS** use scaffold-eth hooks - never direct wagmi/viem calls
- **Read**: `useScaffoldReadContract({ contractName, functionName, args })`
- **Write**: `useScaffoldWriteContract({ contractName })` then `writeContractAsync({ functionName, args })`
- Contracts auto-imported from `packages/nextjs/contracts/deployedContracts.ts`

### UI Components
Use scaffold-eth components for all Ethereum-specific UI:
- `Address` - Display addresses with ENS support
- `AddressInput` - Input addresses
- `Balance` - Display ETH/token balances
- `EtherInput` - Input with ETH/USD conversion

### Type Safety
- NEVER use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Use generics for contract hooks to ensure ABI type safety
- Leverage `abitype` for contract function types

### Polkadot-Specific Notes
- Solidity version: 0.8.28 with PolkaVM compiler (resolc)
- Decimal places: 12 (not 18 like Ethereum)
- Fixed transaction fees (~22 billion wei) vs dynamic Ethereum gas
- Networks: localNode (420420420), passetHub (420420422), kusamaHub (420420418)

### Monorepo Structure
- `packages/hardhat/` - Solidity contracts, tests, deployment scripts
- `packages/nextjs/` - Frontend with Next.js App Router
- `packages/asset-hub-pvm/` - Prebuilt Polkadot binaries (revive-dev-node, eth-rpc)
