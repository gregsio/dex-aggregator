const { expect } = require("chai")
const { ethers, network } = require('hardhat');

const ERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const config = require("../config.json");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

// These tests run against a mainnet fork and need ALCHEMY_API_KEY (see hardhat.config.js).
// They are skipped when the key is not set.
const describeFork = process.env.ALCHEMY_API_KEY ? describe : describe.skip

describeFork("Aggregator (mainnet fork)", () => {

  let deployer, investor1, aggregator
  let amountOut, weth, dai, transaction,
    WETHBalanceBeforeSwap, DAIBalanceBeforeSwap

  const patricio_address = "0x57757E3D981446D585Af0D9Ae4d7DF6D64647806"

  const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const path = [WETH, DAI]
  const DEADLINE = Math.floor(Date.now() / 1000) + 60 * 20

  beforeEach(async () => {

    [deployer] = await ethers.getSigners()

    // Impersonate account patricio_address
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [patricio_address],
    });

    investor1 = await ethers.getSigner(patricio_address);

    // Setup WETH/DAI contracts
    weth = new ethers.Contract(WETH, ERC20.abi, deployer);
    dai = new ethers.Contract(DAI, ERC20.abi, deployer);

    // Deploy aggregator contract
    aggregator = await ethers.deployContract("Aggregator",[
        [
          config.UNISWAP.V2_ROUTER_02_ADDRESS,
          config.SUSHISWAP.V2_ROUTER_02_ADDRESS,
       //   config.SMARTDEX.V2_ROUTER_02_ADDRESS
        ]
      ])

    await aggregator.waitForDeployment()

  })

  describe("Deployment", () => {

    it("Sets the routers", async () => {
     expect(await aggregator.whiteListedRouters(0)).to.equal(config.UNISWAP.V2_ROUTER_02_ADDRESS)
     expect(await aggregator.whiteListedRouters(1)).to.equal(config.SUSHISWAP.V2_ROUTER_02_ADDRESS)
    })
  })

  describe('Trades', () => {

   it('Decreases the source token investor\'s balance', async () => {

      transaction = await weth.connect(investor1).approve(aggregator, tokens(100))
      await transaction.wait()

      amountOut = await aggregator.connect(investor1)
      .getBestAmountsOutOnUniswapForks(
        path,
        tokens(100)
      )

      WETHBalanceBeforeSwap = await weth.balanceOf(investor1)
      transaction = await aggregator.connect(investor1)
      .swapOnUniswapFork(
          path,
          amountOut[1],  //router address
          tokens(100),
          amountOut[0],  //best deal
          0,
          DEADLINE,
        )
      await transaction.wait()

      expect(
        await weth.balanceOf(investor1)).to.equal(
          WETHBalanceBeforeSwap - tokens(100))
    })

    it('Increases the destination token inverstor\'s balance', async () => {

      DAIBalanceBeforeSwap = await dai.balanceOf(investor1)

      transaction = await weth.connect(investor1).approve(aggregator, tokens(10))
      await transaction.wait()

      //Get best deal
      amountOut = await aggregator.connect(investor1)
      .getBestAmountsOutOnUniswapForks(
        path,
        tokens(10)
      )
     // Swap tokens
      transaction = await aggregator.connect(investor1)
      .swapOnUniswapFork(
          path,
          amountOut[1],  //best router address
          tokens(10),
          amountOut[0],  //best deal
          0,
          DEADLINE
        )

      await transaction.wait()

      expect(await dai.balanceOf(investor1)).to.equal(DAIBalanceBeforeSwap + amountOut[0])

    })

    it('Emits Swap events', async () => {

      transaction = await weth.connect(investor1).approve(aggregator, tokens(10))
      await transaction.wait()

      //Get best deal
      amountOut = await aggregator.connect(investor1)
      .getBestAmountsOutOnUniswapForks(
        path,
        tokens(10)
      )
     // Swap tokens
      await expect(aggregator.connect(investor1)
      .swapOnUniswapFork(
          path,
          amountOut[1],  //best router address
          tokens(10),
          amountOut[0],  //best deal
          0,
          DEADLINE
        )).to.emit(aggregator, "Swap")
      .withArgs(
        amountOut[1], // router address
        path,
        tokens(10),
        amountOut[0],
        patricio_address
        )

    })

  })
})
