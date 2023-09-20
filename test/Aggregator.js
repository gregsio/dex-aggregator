const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Aggregator', () => {
  let accounts,
      deployer,
      liquidityProvider,
      investor1,
      investor2

  let token1,
      token2,
      amm1,
      amm2,
      aggregator

  beforeEach(async () => {
    // Setup Accounts
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    liquidityProvider = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]

    // Deploy Token
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('Gregs dApp', 'DAPP', '1000000') // 1 Million Tokens
    token2 = await Token.deploy('USD Token', 'USD', '1000000') // 1 Million Tokens

    // Send tokens to liquidity provider
    let transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    // Send token1 to investor1
    transaction = await token1.connect(deployer).transfer(investor1.address, tokens(100000))
    await transaction.wait()

    // Send token2 to investor2
    transaction = await token2.connect(deployer).transfer(investor2.address, tokens(100000))
    await transaction.wait()

    // Deploy AMM1
    const AMM1 = await ethers.getContractFactory('AMM')
    amm1 = await AMM1.deploy(token1, token2)

    // Deploy AMM2
    const AMM2 = await ethers.getContractFactory('AMM')
    amm2 = await AMM2.deploy(token1, token2)

    // Deploy Aggregator
    const Aggregator = await ethers.getContractFactory('Aggregator')
    aggregator = await Aggregator.deploy(amm1, amm2, token1, token2)

    // Deployer approves 100k tokens
    amount = tokens(100000)

    transaction = await token1.connect(deployer).approve(amm1.target, amount)
    await transaction.wait()

    transaction = await token1.connect(deployer).approve(amm2.target, amount)
    await transaction.wait()


    transaction = await token2.connect(deployer).approve(amm1.target, amount)
    await transaction.wait()

    transaction = await token2.connect(deployer).approve(amm2.target, amount)
    await transaction.wait()

    // Deployer adds liquidity to amm1
    transaction = await amm1.connect(deployer).addLiquidity(amount, amount)
    await transaction.wait()

    // Deployer adds liquidity to amm2
    transaction = await amm2.connect(deployer).addLiquidity(amount, amount)
    await transaction.wait()

    // Investor1 Approve tokens to AMM1
    transaction = await token1.connect(investor1).approve(amm1, tokens(100000))
    await transaction.wait()

    // Investor2 approves all tokens
    transaction = await token2.connect(investor2).approve(amm2, tokens(100000))
    await transaction.wait()

  })

  describe('Deployment', () => {

    it('has an address', async () => {
      expect(amm1.target).to.not.equal(0x0)
      expect(amm2.target).to.not.equal(0x0)
      expect(aggregator.target).to.not.equal(0x0)
    })

    it('tracks token1 address', async () => {
      //console.log(aggregator.amm1)
      expect(await aggregator.token1()).to.equal(await amm1.token1())
      expect(await aggregator.token1()).to.equal(await amm2.token1())
    })

    it('tracks token2 address', async () => {
      expect(await aggregator.token2()).to.equal(await amm1.token2())
      expect(await aggregator.token1()).to.equal(await amm2.token1())
    })
  })

  describe('Aggregator', () => {

    it('Returns the best route', async () => {

        // Investor1 swaps 150 token1 on AMM1
        transaction = await amm1.connect(investor1).swapToken1(tokens(150))
        result = await transaction.wait()

        // Investor1 swaps 150 token2 on AMM1
        transaction = await amm2.connect(investor2).swapToken2(tokens(150))
        result = await transaction.wait()
        bestRoute = await aggregator.fetchBestRoute(token1.target,tokens(10000))

        expect(bestRoute[1]).to.equal('0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575')

        // Investor1 swaps 20000 token2 on AMM2
        transaction = await amm2.connect(investor2).swapToken2(tokens(20000))
        result = await transaction.wait()
        bestRoute = await aggregator.fetchBestRoute(token2.target,tokens(10000))

        expect(bestRoute[1]).to.equal('0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154')
     })
  })
})
