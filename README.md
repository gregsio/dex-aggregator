# Dex Aggregator for Uniswap Forks

An easy-to-use DEX aggregator that interacts with various Uniswap forks. Find the best trading rates and liquidity, and maximize your DeFi experience.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Supported DEXes](#supported-dexes)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- **Best Rate Discovery:** Automatically discover the best rates across multiple DEXes.
- **Low Slippage:** Our system minimizes trade slippage by splitting trades across multiple liquidity pools.
- **Gas Efficiency:** Optimized contract calls ensure you save on gas costs.
- **Easy Integration:** Designed to be integrated with dApps, wallets, and other platforms.

## Prerequisites

- Node.js version `14.x` or higher
- Ethereum wallet with some ETH for transaction fees

## Installation

1. Clone the repository:
2. Navigate to the project directory
3. Install the required dependencies:
**
npm install
**

## Usage

1. Update the `.env` file with your Ethereum gateway provider's API key.

2. Start the application: npm run start

3. Interact with the platform via the provided web interface or API endpoints.

## Supported DEXes

- Uniswap V2
- Sushiswap
- Mode DEXs to come...

Want to add support for another DEX? Check the [contributing guidelines](#contributing).

## Contributing

We welcome contributions to improve this aggregator. Please follow the steps below:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a new Pull Request.


## License

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details.

## Acknowledgements

- Thanks to all the Uniswap forks for creating such versatile platforms.
- The Ethereum community for invaluable tools and resources.

---

Happy trading! If you have any issues, please [raise an issue](https://github.com/gregsio/dex-aggregator/issues)