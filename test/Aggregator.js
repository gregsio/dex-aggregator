const { expect } = require("chai")
const { ethers } = require('hardhat');
const { mine } = require("@nomicfoundation/hardhat-network-helpers")

const UniswapV2Router02 = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json')
const ERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const config = require("../config.json");
const { configure } = require("@testing-library/react");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe("Aggregator", () => {

  let deployer, aggregator
  let amountOut, weth, dai, uRouter,
    WETHBalanceBeforeSwap, DAIBalanceBeforeSwap

  const patricio_address = "0x57757E3D981446D585Af0D9Ae4d7DF6D64647806"

  const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const path = [WETH, DAI]
  const DEADLINE = Math.floor(Date.now() / 1000) + 60 * 20
  const AMOUNT = hre.ethers.parseUnits('1', 'ether')


  //WETH = await aggregator.WETH()

  beforeEach(async () => {

    [deployer] = await ethers.getSigners()

    // Impersonate account patricio_address
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [patricio_address],
    });

    investor1 = await ethers.getSigner(patricio_address);

    // Setup WETH/DAI contracts
    weth = new hre.ethers.Contract(WETH, ERC20.abi, deployer);
    dai = new hre.ethers.Contract(DAI, ERC20.abi, deployer);

    // Setup Uniswap V2 Router contract...
    uRouter = new hre.ethers.Contract(
      config.UNISWAP.V2_ROUTER_02_ADDRESS,
      UniswapV2Router02.abi,
      deployer)


    // Deploy aggregator contract
    aggregator = await hre.ethers.deployContract("Aggregator",[
        [
          config.UNISWAP.V2_ROUTER_02_ADDRESS,
          config.SUSHISWAP.V2_ROUTER_02_ADDRESS,
       //   config.SMARTDEX.V2_ROUTER_02_ADDRESS
        ],
        2
      ])

    await aggregator.waitForDeployment()

    // Delgate investor1 tokens to DEX Aggregator contract
    // transaction = await weth.connect(investor1).approve(aggregator, tokens(200))
    // transaction.wait()

  })

  describe("Deployment", () => {

    it("Sets the routers", async () => {
     expect(await aggregator.whiteListedRouters(0)).to.equal(config.UNISWAP.V2_ROUTER_02_ADDRESS)
     expect(await aggregator.whiteListedRouters(1)).to.equal(config.SUSHISWAP.V2_ROUTER_02_ADDRESS)
    })

    it("Sets the owner", async () => {
      expect(await aggregator.owner()).to.equal(await deployer.getAddress())
    })
  })

//  describe('Aggregates routes from several DEXs', () => {

//     it('Returns the best route', async () => {
//       amountOut = await aggregator.connect(investor1)
//         .getBestAmountsOutOnUniswapForks(
//           path,
//           tokens(100)
//         )

//       expect(amountOut[1]).to.be.properAddress;
//       expect(typeof amountOut[0]).to.equal('bigint')
//     })

//     it('Swaps tokens on the best route', async () => {
//       transaction = await aggregator.connect(investor1)
//       .swapOnUniswapFork(
//           path,
//           amountOut[1],  //router address
//           tokens(100),
//           amountOut[0],  //best deal
//           0,
//           DEADLINE
//           )
//       expect( await transaction.wait()).to.not.be.reverted;
//     })
//  })

  describe('Trades', () => {

   it('Decreases the source token investor\'s balance', async () => {

      transaction = await weth.connect(investor1).approve(aggregator, tokens(100))
      transaction.wait()

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
      result = await transaction.wait()

      expect(
        await weth.balanceOf(investor1)).to.equal(
          WETHBalanceBeforeSwap - tokens(100))
    })

    it('Increases the destination token inverstor\'s balance', async () => {

      DAIBalanceBeforeSwap = await dai.balanceOf(investor1)

      transaction = await weth.connect(investor1).approve(aggregator, tokens(10))
      transaction.wait()

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

      result = await transaction.wait()
      //console.log(result)

      // // Fast forward 5 blocks...
      // // New blocks are validated roughly every ~ 12 seconds
      // const BLOCKS_TO_MINE = 5
      // console.log(`\nFast forwarding ${BLOCKS_TO_MINE} Blocks...\n`)
      // await mine(BLOCKS_TO_MINE, { interval: 12 })

      console.log(
        'allowance after transaction: ',
        await weth.connect(investor1).allowance(
          await investor1.getAddress(),
          //config.UNISWAP.V2_ROUTER_02_ADDRESS
          aggregator
          )
      )

      expect(await dai.balanceOf(investor1)).to.be.above(DAIBalanceBeforeSwap)

    })

    it('Emits Swap events', async () => {

      DAIBalanceBeforeSwap = await dai.balanceOf(investor1)

      transaction = await weth.connect(investor1).approve(aggregator, tokens(10))
      transaction.wait()

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

      result = await transaction.wait()
        
      expect(transaction).to.emit(aggregator, "Swap")
      .withArgs(
        amountOut[1], // router address
        path,
        tokens(10),
        investor1.getAddress()
        )

    })

  })
})
