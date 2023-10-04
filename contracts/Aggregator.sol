// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Aggregator {
    address public owner;
    uint256 defaultSlippagePercent;
    address[] public whiteListedRouters;

    constructor(address[] memory _routers, uint16 _defaultSlippagePercent) {
        whiteListedRouters = _routers;
        owner = msg.sender;
        defaultSlippagePercent = _defaultSlippagePercent;
    }

    /// @notice Swap tokens on Uniswap, Sushiswap or other forks
    /// @dev _path can have several pairs
    /// @param _path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
    /// @param _routerAddress address of the Uniswap router or one of its forks e.g sushiswap
    /// @param _amountIn The amount of input tokens to swap.
    /// @param _minAmountOutBeforeSlippage The minimum amount of output tokens that must be received for the transaction not to revert.
    /// @param _maxSlippagePercent The maximum slippage percentage allowed by the transaction

    function swapOnUniswapFork(
        address[] calldata _path,
        address _routerAddress,
        uint256 _amountIn,
        uint256 _minAmountOutBeforeSlippage,
        uint256 _maxSlippagePercent,
        uint256 deadline
    ) public validRouter(_routerAddress) {
        require(
            IERC20(_path[0]).balanceOf(msg.sender) > _amountIn,
            "not enough tokens available"
        );
        require(
            IERC20(_path[0]).transferFrom(msg.sender, address(this), _amountIn),
            "transferFrom failed."
        );
        require(
            IERC20(_path[0]).approve(_routerAddress, _amountIn),
            "Router approval failed."
        );

        uint256 slippage = SafeMath.div(
            SafeMath.mul(_minAmountOutBeforeSlippage, _maxSlippagePercent),
            1000
        );
        uint256 minAmountOut = SafeMath.sub(
            _minAmountOutBeforeSlippage,
            slippage
        );

        IUniswapV2Router02(_routerAddress).swapExactTokensForTokens(
            _amountIn,
            minAmountOut,
            _path,
            address(msg.sender),
            deadline
        );

        emit Swap(_routerAddress, _path, _amountIn, msg.sender);
    }

    event Swap(
        address router,
        address[] _path,
        uint256 amount_from,
        address to
    );

    /// @notice Find the best deal for swapping tokens on Uniswap, Sushiswap or other forks
    /// @dev _path can have several pairs,
    /// @param _path An array of token addresses. path.length must be >= 2.
    /// @param _amount QTY of tokens to quote exchange for

    function getBestAmountsOutOnUniswapForks(
        address[] memory _path,
        uint256 _amount
    ) public view returns (uint256 bestAmountOut, address bestRouter) {
        if (_amount == 0) {
            bestAmountOut = 0;
            bestRouter = address(0);
            return (bestAmountOut, bestRouter);
        }

        uint256[] memory amountOut;
        uint8 i = 0;
        uint lastHop = _path.length - 1;
        for (i = 0; i < whiteListedRouters.length; i++) {
            amountOut = IUniswapV2Router02(whiteListedRouters[i]).getAmountsOut(
                    _amount,
                    _path
                );
            if (amountOut[lastHop] > bestAmountOut) {
                bestAmountOut = amountOut[lastHop];
                bestRouter = whiteListedRouters[i];
            }
        }
    }

    modifier validRouter(address routerAddress) {
        uint8 i;
        bool isWhiteListedRouter = false;
        for (i = 0; i < whiteListedRouters.length; i++) {
            if (whiteListedRouters[i] == routerAddress) {
                isWhiteListedRouter = true;
                break;
            }
        }
        require(isWhiteListedRouter, "Router must be whitelisted");
        _;
    }
}
