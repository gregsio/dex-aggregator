const { expect } = require("chai")
const { ethers } = require('hardhat');

const config = require("../config.json")
const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

const ether = tokens
const ERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");

describe("Aggregator", () => {
  let owner
  let aggregator

  let patricio_address = "0x57757E3D981446D585Af0D9Ae4d7DF6D64647806"

  let USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  let WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  let DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  //WETH = await aggregator.WETH()
  let WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  path = [WETH, DAI]

  let amountOut;

  beforeEach(async () => {

    //  impersonating account
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [patricio_address],
    });
     investor1 = await ethers.getSigner(patricio_address);

     // HH users
    [owner] = await ethers.getSigners()

    aggregator = await hre.ethers.deployContract(
      "Aggregator",
      [
        [
          config.UNISWAP.V2_ROUTER_02_ADDRESS,
          config.SUSHISWAP.V2_ROUTER_02_ADDRESS,
       //   config.SMARTDEX.V2_ROUTER_02_ADDRESS
        ],
        1
      ]
    )

    result = await aggregator.waitForDeployment()
    //console.log(`Aggregator contract deployed to ${await aggregator.target}`)

    // Approves DEX Aggregator to handle tokens
    let weth
    weth = new hre.ethers.Contract(WETH,ERC20.abi,investor1);
    transaction = await weth.connect(investor1).approve(aggregator, tokens(10000))
    result = await transaction.wait()
    //console.log(result)

  })

  describe("Deployment", () => {
    it("Sets the routers", async () => {
     expect(await aggregator.routers(0)).to.equal(config.UNISWAP.V2_ROUTER_02_ADDRESS)
     expect(await aggregator.routers(1)).to.equal(config.SUSHISWAP.V2_ROUTER_02_ADDRESS)
    })

    it("Sets the owner", async () => {
      expect(await aggregator.owner()).to.equal(await owner.getAddress())
    })
  })

 describe('Aggregates routes from several DEXs', () => {

    it('Returns the best route', async () => {
      amountOut = await aggregator.connect(investor1)
        .getBestAmountsOutOnUniswapForks(
          path,
          tokens(1000)
        )

      expect(amountOut[1]).to.be.properAddress;
      expect(typeof amountOut[0]).to.equal('bigint')
    })

    it('Swaps tokens on the chosen DEX', async () => {
      transaction = await aggregator.connect(investor1)
      .swapOnUniswapFork(
          path,
          amountOut[1],  //router address
          tokens(1000),
          amountOut[0],
          5
        )
      result = await transaction.wait()
      expect(result).to.not.be.reverted;
    })


    //   amountOut = await aggregator.connect(investor1)
    //   .getBestAmountsOutOnUniswapForks(
    //     path,
    //     tokens(1000)
    //   )
    //   console.log('Best Swap: ', amountOut)

    //   transaction = await aggregator.connect(investor1)
    //   .swapOnUniswapFork(
    //     path,
    //     config.SUSHISWAP.V2_ROUTER_02_ADDRESS,
    //     tokens(1000),
    //     amountOut[0],
    //     5
    //   )
    // result = await transaction.wait()

  })

})
