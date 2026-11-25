# DEX Aggregator for Uniswap V2 Forks

[![CI](https://github.com/gregsio/dex-aggregator/actions/workflows/ci.yml/badge.svg)](https://github.com/gregsio/dex-aggregator/actions/workflows/ci.yml)

A learning project: a small Solidity contract that picks the best price for a token swap across a
whitelist of Uniswap V2-compatible routers (Uniswap V2 and Sushiswap), plus a React front end to
quote and execute swaps from a browser wallet.

The contract is unaudited. Do not use it with mainnet funds.

## How it works

`contracts/Aggregator.sol` is deployed with a fixed list of router addresses and exposes two functions:

- **Quote** (`getBestAmountsOutOnUniswapForks`): a view call that asks each whitelisted router what
  a given input amount would return along a token path, and returns the highest output amount
  together with the router that offered it.
- **Swap** (`swapOnUniswapFork`): pulls the input tokens from the caller, approves the chosen
  whitelisted router and performs an exact-input swap through it. The caller supplies the expected
  output, a maximum slippage and a deadline; the swap reverts if the output falls below that bound.
  Output tokens go straight to the caller.

The front end calls the quote function, shows the best router and amount, and submits the swap to
that router.

## Quick start

Requires Node.js 20 (see `.nvmrc`) and npm.

```sh
git clone https://github.com/gregsio/dex-aggregator.git
cd dex-aggregator
npm install
npx hardhat compile
npx hardhat test
```

The unit tests run against mock contracts and need no network access or API key.

### Mainnet-fork tests (optional)

Fork tests exercise the contract against the real Uniswap and Sushiswap routers. They are skipped
unless an Alchemy key is available:

```sh
cp .env.example .env    # then set ALCHEMY_API_KEY
npx hardhat test
```

### Running the app locally

The deploy and seed scripts use mainnet router and token addresses, so the local node must fork
mainnet (`ALCHEMY_API_KEY` set in `.env`).

```sh
npx hardhat node                                         # terminal 1: local forked chain
npx hardhat run scripts/deploy.js --network localhost    # terminal 2: deploy the aggregator
npx hardhat run scripts/seed.js --network localhost      # fund the first account with WETH and DAI
npm run start                                            # front end on http://localhost:3000
```

`deploy.js` prints the deployed address. If it differs from the `31337` entry in `src/config.json`,
update that entry. Then point the browser wallet at the local network (chain ID 31337) and import
the first Hardhat account.

## Project layout

```
contracts/     Aggregator.sol
test/          Hardhat tests
scripts/       deploy.js (deploys with the Uniswap V2 and Sushiswap routers), seed.js (funds a local account)
config.json    Router and factory addresses used by scripts and tests
src/           React front end: components/, Redux store/, contract ABIs, per-chain config.json
```

## Limitations and possible next steps

- A swap executes on a single router. There is no split routing across pools or routers.
- Only Uniswap V2-style routers are supported; no V3, Curve or Balancer pools.
- The caller chooses the token path. The contract compares routers for that path and does no path finding.
- Quoting makes one external call per whitelisted router, so cost grows linearly with the list.
- The router whitelist is set at deployment and cannot be changed afterwards.
- Quotes are spot values from pool reserves. A swap sent to the public mempool can still be
  sandwiched within its slippage bound.

## License

MIT. See [LICENSE.md](./LICENSE.md).
