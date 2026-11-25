require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox")

const privateKey = process.env.PRIVATE_KEY || ""
const alchemyApiKey = process.env.ALCHEMY_API_KEY

// Mainnet forking is only enabled when an Alchemy key is provided.
// Without it the hardhat network runs fully local and the fork tests are skipped.
const forking = alchemyApiKey
  ? {
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
       // blockNumber: 18219000
      }
    }
  : {}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      ...forking
    }
  }
};
