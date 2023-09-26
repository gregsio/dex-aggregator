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

  let USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  let WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'

  let DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

  beforeEach(async () => {

    const patricio_address = "0x57757E3D981446D585Af0D9Ae4d7DF6D64647806"

    //  impersonating account
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [patricio_address],
    });

     investor1 = await ethers.getSigner(patricio_address);
    //

    [owner] = await ethers.getSigners()

    aggregator = await hre.ethers.deployContract(
      "Aggregator",
      [
        config.SUSHISWAP.V2_ROUTER_02_ADDRESS,
        config.UNISWAP.V2_ROUTER_02_ADDRESS,
        1
      ]
    )

    await aggregator.waitForDeployment()
    console.log(`Aggregator contract deployed to ${await aggregator.getAddress()}`)

  })

  describe("Deployment", () => {
    it("Sets the sRouter", async () => {
      expect(await aggregator.sRouter()).to.equal(config.SUSHISWAP.V2_ROUTER_02_ADDRESS)
    })

    it("Sets the uRouter", async () => {
      expect(await aggregator.uRouter()).to.equal(config.UNISWAP.V2_ROUTER_02_ADDRESS)
    })

    it("Sets the owner", async () => {
      expect(await aggregator.owner()).to.equal(await owner.getAddress())
    })
  })

 describe('Aggregates routes from several DEXs', () => {

    it('Returns the best route', async () => {
        //WETH = await aggregator.WETH()
        const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        path = [WETH, DAI]


        //console.log(path)
        amountOut = await aggregator.connect(investor1)
          .getBestAmountsOutOnUniswapForks(
            path,
            tokens(1000)
          )
       console.log('Best Swap: ', amountOut)

        let weth
        weth = new hre.ethers.Contract(WETH,ERC20.abi,investor1);

        transaction = await weth.connect(investor1).approve(aggregator, tokens(10000))
        result = await transaction.wait()
        //console.log(result)

        // transaction = await investor1.sendTransaction({from:investor1.getAddress(), to:aggregator.target, value: ether(1)});
        // result = await transaction.wait()
        // console.log(result)

        transaction = await aggregator.connect(investor1)
          .swapOnUniswap(
              path,
              tokens(1000),
              amountOut[0],
            )
        result = await transaction.wait()
        //console.log(result)

        amountOut = await aggregator.connect(investor1)
        .getBestAmountsOutOnUniswapForks(
          path,
          tokens(1000)
        )
        console.log('Best Swap: ', amountOut)

        transaction = await aggregator.connect(investor1)
        .swapOnSushiswap(
            path,
            tokens(1000),
            amountOut[0],
          )
      result = await transaction.wait()

     })
  })

})
