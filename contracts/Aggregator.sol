// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import "hardhat/console.sol";

contract Aggregator {
    IUniswapV2Router02 public immutable sRouter;
    IUniswapV2Router02 public immutable uRouter;


    address public owner;
    uint256 defaultSlippagePercent ;


    constructor(address _sRouter, address _uRouter, uint16 _defaultSlippagePercent) {
        sRouter = IUniswapV2Router02(_sRouter); // Sushiswap
        uRouter = IUniswapV2Router02(_uRouter); // Uniswap
        owner = msg.sender;
        defaultSlippagePercent = _defaultSlippagePercent;
    }

    function swapOnUniswap(
        address[] memory _path,
        uint256 _amountIn,
        uint256 _amountOut
        ) public {

      _swapOnUniswapFork(
            _path,
            uRouter,
            _amountIn,
            _amountOut,
            defaultSlippagePercent
        );
    }

    function swapOnUniswap(
        address[] memory _path,
        uint256 _amountIn,
        uint256 _amountOut,
        uint8 _slippagePercent
        ) public {

        require(
            _slippagePercent >= 0 && _slippagePercent <= 100,
            'Slippage Percent should be between 0 and 100'
        );

        _swapOnUniswapFork(
                _path,
                uRouter,
                _amountIn,
                _amountOut,
                _slippagePercent
            );
    }


    function swapOnSushiswap(
        address[] memory _path,
        uint256 _amountIn,
        uint256 _amountOut
        ) public {

      _swapOnUniswapFork(
            _path,
            sRouter,
            _amountIn,
            _amountOut,
            defaultSlippagePercent
        );
    }

    function swapOnSushiswap(
        address[] memory _path,
        uint256 _amountIn,
        uint256 _amountOut,
        uint8 _slippagePercent
        ) public {

        require(
            _slippagePercent >= 0 && _slippagePercent <= 100,
            'Slippage Percent should be between 0 and 100'
        );

        _swapOnUniswapFork(
                _path,
                uRouter,
                _amountIn,
                _amountOut,
                _slippagePercent
            );
    }

    /// @notice Swap tokens on Uniswap, Sushiswap or other forks
    /// @dev _path can have several pairs
    /// @param _path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
    /// @param _router address of the Uniswap router or one of its forks e.g sushiswap
    /// @param _amountIn The amount of input tokens to send.
    /// @param _maxAmountOut The minimum amount of output tokens that must be received for the transaction not to revert.

    function _swapOnUniswapFork(
        address[] memory _path,
        IUniswapV2Router02 _router,
        uint256 _amountIn,
        uint256 _maxAmountOut,
        uint256 slippagePercent
    ) internal {
//        console.log("_swapOnUniswapFork");

        require (
            IERC20(_path[0]).balanceOf(msg.sender) > _amountIn,'not enough tokens available'
            );

//       uint256 balance = IERC20(_path[0]).balanceOf(msg.sender);
//        console.log(balance);
//        console.log("_swapOnUniswapFork after balanceOf() call");

        require(
            IERC20(_path[0]).transferFrom(msg.sender, address(this), _amountIn),
            'transferFrom failed.'
        );
//        console.log("_swapOnUniswapFork after transferFrom() call");

        require(
            IERC20(_path[0]).approve(address(_router), _amountIn),
            "Router approval failed."
        );
//       console.log("_swapOnUniswapFork after approve() call");

        uint256 slippage = SafeMath.div(SafeMath.mul(_maxAmountOut , slippagePercent), 100);
        uint256 minAmountOut= SafeMath.sub(_maxAmountOut, slippage);

        console.log('maxAmountOut', _maxAmountOut);
        console.log('minAmountOut', minAmountOut);

        _router.swapExactTokensForTokens(
            _amountIn,
            minAmountOut,
            _path,
            address(this),
            (block.timestamp + 1200)
        );
    }

    /// @notice Find the best deal for swapping tokens on Uniswap, Sushiswap or other forks
    /// @dev _path can have several pairs,
    /// @param _path An array of token addresses. path.length must be >= 2.
    ///
    function getBestAmountsOutOnUniswapForks(
        address[] memory _path,
        uint256 _amount
    ) public view returns (uint256 bestAmount, IUniswapV2Router02 bestRouter) {

        uint256[] memory uRouterAmount = uRouter.getAmountsOut(_amount, _path);
        uint256[] memory sRouterAmount = sRouter.getAmountsOut(_amount, _path);

        uint lastHop = _path.length -1;

        if (uRouterAmount[lastHop] >= sRouterAmount[lastHop]) {
            bestAmount = uRouterAmount[lastHop];
            bestRouter = uRouter;
        } else if (uRouterAmount[lastHop] < sRouterAmount[lastHop]) {
            bestAmount = sRouterAmount[lastHop];
            bestRouter = sRouter;
        }
    }

    function getBestPrice() public view {
        // fetch reserve QTY of both token
        // divide both value
        // return result
    }

    // receive() external payable {

    // }

}