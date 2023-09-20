// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.8.18;

//import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AMM.sol";
import "./Token.sol";
import "hardhat/console.sol";


/// Unsupported  token.  ERC20 `token` is not supported
/// @param token unsupported token address.
error UnsupportedToken(address token);

contract Aggregator is AMM {
    AMM public amm1;
    AMM public amm2;

    constructor(AMM _amm1, AMM _amm2, Token _tokenA, Token _tokenB) AMM(_tokenA, _tokenB){
        amm1 = _amm1;
        amm2 = _amm2;
    }

    function fetchBestRoute(
        address _fromToken,
        uint256 _fromTokenAmount
        )
        external view
        returns(uint256 toTokenAmount, address bestDexAddress) {

        uint256 amm1ToTokenAmount;
        uint256 amm2ToTokenAmount;

        if (_fromToken == address(amm1.token1())){
            amm1ToTokenAmount =  amm1.calculateToken1Swap(_fromTokenAmount);
            amm2ToTokenAmount =  amm2.calculateToken1Swap(_fromTokenAmount);
        }
        else if (_fromToken == address(amm1.token2())){
            amm1ToTokenAmount =  amm1.calculateToken2Swap(_fromTokenAmount);
            amm2ToTokenAmount =  amm2.calculateToken2Swap(_fromTokenAmount);
        }
        if (amm1ToTokenAmount > amm2ToTokenAmount) {
            toTokenAmount = amm1ToTokenAmount;
            bestDexAddress = address(amm1);
        }
        else if (amm1ToTokenAmount < amm2ToTokenAmount){
            toTokenAmount = amm2ToTokenAmount;
            bestDexAddress = address(amm2);
        }
    }
}
