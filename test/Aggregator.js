const { expect } = require("chai")
const { ethers } = require('hardhat');
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

// Unit tests against mock routers and tokens: no network access or API key needed.
// The mainnet fork tests live in Aggregator.fork.js.
describe("Aggregator", () => {

  const AMOUNT = tokens(100)

  async function deployFixture() {
    const [deployer, investor1] = await ethers.getSigners()

    const tokenA = await ethers.deployContract("MockERC20", ["Token A", "TKA"])
    const tokenB = await ethers.deployContract("MockERC20", ["Token B", "TKB"])
    const tokenC = await ethers.deployContract("MockERC20", ["Token C", "TKC"])

    // router1 and router2 both have an A/B pool, router2 offers the better price.
    // Only router1 has a B/C pool. router3 has no pool at all.
    const router1 = await ethers.deployContract("MockUniswapV2Router")
    const router2 = await ethers.deployContract("MockUniswapV2Router")
    const router3 = await ethers.deployContract("MockUniswapV2Router")
    const unlistedRouter = await ethers.deployContract("MockUniswapV2Router")

    await router1.setRate(tokenA, tokenB, tokens(2))
    await router2.setRate(tokenA, tokenB, tokens(3))
    await router1.setRate(tokenB, tokenC, tokens(5))
    await unlistedRouter.setRate(tokenA, tokenB, tokens(4))

    const aggregator = await ethers.deployContract("Aggregator", [
      [router1.target, router2.target, router3.target]
    ])

    await tokenA.mint(investor1.address, AMOUNT)
    await tokenA.connect(investor1).approve(aggregator, AMOUNT)

    const path = [tokenA.target, tokenB.target]
    const deadline = (await time.latest()) + 60 * 20

    return {
      deployer, investor1, aggregator,
      tokenA, tokenB, tokenC,
      router1, router2, router3, unlistedRouter,
      path, deadline
    }
  }

  describe("Deployment", () => {

    it("Sets the routers", async () => {
      const { aggregator, router1, router2, router3 } = await loadFixture(deployFixture)

      expect(await aggregator.whiteListedRouters(0)).to.equal(router1.target)
      expect(await aggregator.whiteListedRouters(1)).to.equal(router2.target)
      expect(await aggregator.whiteListedRouters(2)).to.equal(router3.target)
    })

    it("Whitelists only the given routers", async () => {
      const { aggregator, router1, unlistedRouter } = await loadFixture(deployFixture)

      expect(await aggregator.isWhiteListedRouter(router1.target)).to.equal(true)
      expect(await aggregator.isWhiteListedRouter(unlistedRouter.target)).to.equal(false)
    })

    it("Rejects a router that is not a contract", async () => {
      const { deployer } = await loadFixture(deployFixture)

      await expect(ethers.deployContract("Aggregator", [[deployer.address]]))
        .to.be.revertedWith("Router is not a contract")
    })

    it("Rejects duplicate routers", async () => {
      const { router1 } = await loadFixture(deployFixture)

      await expect(ethers.deployContract("Aggregator", [[router1.target, router1.target]]))
        .to.be.revertedWith("Duplicate router")
    })

    it("Rejects an empty router list", async () => {
      await expect(ethers.deployContract("Aggregator", [[]]))
        .to.be.revertedWith("No routers")
    })
  })

  describe("Quotes", () => {

    it("Returns the best amount and router", async () => {
      const { aggregator, router2, path } = await loadFixture(deployFixture)

      const [bestAmountOut, bestRouter] =
        await aggregator.getBestAmountsOutOnUniswapForks(path, AMOUNT)

      expect(bestAmountOut).to.equal(tokens(300))
      expect(bestRouter).to.equal(router2.target)
    })

    it("Follows the price when another router becomes better", async () => {
      const { aggregator, router1, tokenA, tokenB, path } = await loadFixture(deployFixture)

      await router1.setRate(tokenA, tokenB, tokens(3.5))

      const [bestAmountOut, bestRouter] =
        await aggregator.getBestAmountsOutOnUniswapForks(path, AMOUNT)

      expect(bestAmountOut).to.equal(tokens(350))
      expect(bestRouter).to.equal(router1.target)
    })

    it("Returns zero for a zero amount", async () => {
      const { aggregator, path } = await loadFixture(deployFixture)

      const [bestAmountOut, bestRouter] =
        await aggregator.getBestAmountsOutOnUniswapForks(path, 0)

      expect(bestAmountOut).to.equal(0)
      expect(bestRouter).to.equal(ethers.ZeroAddress)
    })

    it("Skips routers without a pool for the path", async () => {
      const { aggregator, router1, tokenA, tokenB, tokenC } = await loadFixture(deployFixture)

      // Only router1 can quote A -> B -> C, router2 and router3 revert
      const [bestAmountOut, bestRouter] =
        await aggregator.getBestAmountsOutOnUniswapForks(
          [tokenA.target, tokenB.target, tokenC.target],
          AMOUNT
        )

      expect(bestAmountOut).to.equal(tokens(1000))
      expect(bestRouter).to.equal(router1.target)
    })

    it("Returns zero when no router has a pool for the path", async () => {
      const { aggregator, tokenA, tokenC } = await loadFixture(deployFixture)

      const [bestAmountOut, bestRouter] =
        await aggregator.getBestAmountsOutOnUniswapForks(
          [tokenA.target, tokenC.target],
          AMOUNT
        )

      expect(bestAmountOut).to.equal(0)
      expect(bestRouter).to.equal(ethers.ZeroAddress)
    })
  })

  describe("Trades", () => {

    it("Swaps the investor's full balance on the best route", async () => {
      const { aggregator, investor1, tokenA, tokenB, router2, path, deadline } =
        await loadFixture(deployFixture)

      const [bestAmountOut, bestRouter] =
        await aggregator.getBestAmountsOutOnUniswapForks(path, AMOUNT)

      // AMOUNT is everything investor1 holds
      expect(await tokenA.balanceOf(investor1.address)).to.equal(AMOUNT)

      await aggregator.connect(investor1)
        .swapOnUniswapFork(path, bestRouter, AMOUNT, bestAmountOut, 0, deadline)

      expect(await tokenA.balanceOf(investor1.address)).to.equal(0)
      expect(await tokenB.balanceOf(investor1.address)).to.equal(bestAmountOut)
      expect(await tokenA.balanceOf(router2.target)).to.equal(AMOUNT)
    })

    it("Leaves no tokens or allowance behind in the aggregator", async () => {
      const { aggregator, investor1, tokenA, tokenB, router2, path, deadline } =
        await loadFixture(deployFixture)

      await aggregator.connect(investor1)
        .swapOnUniswapFork(path, router2.target, AMOUNT, tokens(300), 0, deadline)

      expect(await tokenA.balanceOf(aggregator.target)).to.equal(0)
      expect(await tokenB.balanceOf(aggregator.target)).to.equal(0)
      expect(await tokenA.allowance(aggregator.target, router2.target)).to.equal(0)
    })

    it("Swaps over several hops", async () => {
      const { aggregator, investor1, tokenA, tokenB, tokenC, router1, deadline } =
        await loadFixture(deployFixture)

      const path = [tokenA.target, tokenB.target, tokenC.target]

      await aggregator.connect(investor1)
        .swapOnUniswapFork(path, router1.target, AMOUNT, tokens(1000), 0, deadline)

      expect(await tokenC.balanceOf(investor1.address)).to.equal(tokens(1000))
    })

    it("Emits a Swap event", async () => {
      const { aggregator, investor1, router2, path, deadline } =
        await loadFixture(deployFixture)

      await expect(aggregator.connect(investor1)
        .swapOnUniswapFork(path, router2.target, AMOUNT, tokens(300), 0, deadline))
        .to.emit(aggregator, "Swap")
        .withArgs(router2.target, path, AMOUNT, tokens(300), investor1.address)
    })

    it("Swaps tokens that do not return a value on transfer and approve", async () => {
      const { aggregator, investor1, tokenB, router1, deadline } =
        await loadFixture(deployFixture)

      const noReturnToken = await ethers.deployContract("MockNoReturnERC20")
      await noReturnToken.mint(investor1.address, AMOUNT)
      await noReturnToken.connect(investor1).approve(aggregator, AMOUNT)
      await router1.setRate(noReturnToken, tokenB, tokens(2))

      const path = [noReturnToken.target, tokenB.target]
      const half = AMOUNT / 2n

      // Two swaps in a row: the router allowance is set again on the second one
      await aggregator.connect(investor1)
        .swapOnUniswapFork(path, router1.target, half, tokens(100), 0, deadline)
      await aggregator.connect(investor1)
        .swapOnUniswapFork(path, router1.target, half, tokens(100), 0, deadline)

      expect(await noReturnToken.balanceOf(investor1.address)).to.equal(0)
      expect(await tokenB.balanceOf(investor1.address)).to.equal(tokens(200))
    })

    it("Rejects routers that are not whitelisted", async () => {
      const { aggregator, investor1, unlistedRouter, path, deadline } =
        await loadFixture(deployFixture)

      await expect(aggregator.connect(investor1)
        .swapOnUniswapFork(path, unlistedRouter.target, AMOUNT, tokens(400), 0, deadline))
        .to.be.revertedWith("Router must be whitelisted")
    })

    it("Rejects a path with less than two tokens", async () => {
      const { aggregator, investor1, tokenA, router2, deadline } =
        await loadFixture(deployFixture)

      await expect(aggregator.connect(investor1)
        .swapOnUniswapFork([tokenA.target], router2.target, AMOUNT, 0, 0, deadline))
        .to.be.revertedWith("Invalid path")
    })

    it("Rejects swaps above the investor's balance", async () => {
      const { aggregator, investor1, tokenA, tokenB, router2, path, deadline } =
        await loadFixture(deployFixture)

      await tokenA.connect(investor1).approve(aggregator, AMOUNT + 1n)

      await expect(aggregator.connect(investor1)
        .swapOnUniswapFork(path, router2.target, AMOUNT + 1n, 1, 0, deadline))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance")

      expect(await tokenB.balanceOf(investor1.address)).to.equal(0)
    })

    it("Rejects swaps after the deadline", async () => {
      const { aggregator, investor1, router2, path, deadline } =
        await loadFixture(deployFixture)

      await time.increaseTo(deadline + 1)

      await expect(aggregator.connect(investor1)
        .swapOnUniswapFork(path, router2.target, AMOUNT, tokens(300), 0, deadline))
        .to.be.revertedWith("UniswapV2Router: EXPIRED")
    })
  })

  describe("Slippage", () => {

    // Quote is 300 B for 100 A on router2, then the price moves 1% against the investor
    async function priceDropFixture() {
      const fixture = await loadFixture(deployFixture)
      const { router2, tokenA, tokenB } = fixture

      await router2.setRate(tokenA, tokenB, tokens(2.97))

      return { ...fixture, quote: tokens(300), amountAfterDrop: tokens(297) }
    }

    it("Reverts when the output is below the quote and no slippage is allowed", async () => {
      const { aggregator, investor1, tokenA, router2, path, deadline, quote } =
        await priceDropFixture()

      await expect(aggregator.connect(investor1)
        .swapOnUniswapFork(path, router2.target, AMOUNT, quote, 0, deadline))
        .to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT")

      expect(await tokenA.balanceOf(investor1.address)).to.equal(AMOUNT)
    })

    it("Reverts when the output is below the slippage bound", async () => {
      const { aggregator, investor1, router2, path, deadline, quote } =
        await priceDropFixture()

      // 99 bps = 0.99%, minimum output is 297.03
      await expect(aggregator.connect(investor1)
        .swapOnUniswapFork(path, router2.target, AMOUNT, quote, 99, deadline))
        .to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT")
    })

    it("Swaps when the output is exactly at the slippage bound", async () => {
      const { aggregator, investor1, tokenB, router2, path, deadline, quote, amountAfterDrop } =
        await priceDropFixture()

      // 100 bps = 1%, minimum output is 297
      await aggregator.connect(investor1)
        .swapOnUniswapFork(path, router2.target, AMOUNT, quote, 100, deadline)

      expect(await tokenB.balanceOf(investor1.address)).to.equal(amountAfterDrop)
    })

    it("Accepts a slippage just below 100%", async () => {
      const { aggregator, investor1, tokenB, router2, path, deadline, quote, amountAfterDrop } =
        await priceDropFixture()

      await aggregator.connect(investor1)
        .swapOnUniswapFork(path, router2.target, AMOUNT, quote, 9999, deadline)

      expect(await tokenB.balanceOf(investor1.address)).to.equal(amountAfterDrop)
    })

    it("Rejects a slippage of 100% or more", async () => {
      const { aggregator, investor1, router2, path, deadline, quote } =
        await priceDropFixture()

      for (const bps of [10000, 10001]) {
        await expect(aggregator.connect(investor1)
          .swapOnUniswapFork(path, router2.target, AMOUNT, quote, bps, deadline))
          .to.be.revertedWith("Slippage must be below 100%")
      }
    })

    it("Rejects a swap with no expected amount", async () => {
      const { aggregator, investor1, router2, path, deadline } =
        await priceDropFixture()

      await expect(aggregator.connect(investor1)
        .swapOnUniswapFork(path, router2.target, AMOUNT, 0, 100, deadline))
        .to.be.revertedWith("Expected amount is zero")
    })
  })
})
