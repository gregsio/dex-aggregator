// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract Aggregator {
    using SafeERC20 for IERC20;

    /// @notice Denominator for slippage values: 10000 basis points = 100%
    uint256 public constant MAX_BPS = 10000;

    address[] public whiteListedRouters;
    mapping(address => bool) public isWhiteListedRouter;

    event Swap(
        address indexed router,
        address[] path,
        uint256 amountIn,
        uint256 amountOut,
        address indexed to
    );

    modifier validRouter(address _routerAddress) {
        require(
            isWhiteListedRouter[_routerAddress],
            "Router must be whitelisted"
        );
        _;
    }

    constructor(address[] memory _routers) {
        require(_routers.length > 0, "No routers");
        for (uint256 i = 0; i < _routers.length; i++) {
            require(_routers[i].code.length > 0, "Router is not a contract");
            require(!isWhiteListedRouter[_routers[i]], "Duplicate router");
            isWhiteListedRouter[_routers[i]] = true;
        }
        whiteListedRouters = _routers;
    }

    /// @notice Swap tokens on Uniswap, Sushiswap or other forks
    /// @dev _path can have several pairs. Fee-on-transfer tokens are not supported.
    /// @param _path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
    /// @param _routerAddress address of the Uniswap router or one of its forks e.g sushiswap
    /// @param _amountIn The amount of input tokens to swap.
    /// @param _expectedAmountOut The quoted amount of output tokens, as returned by getBestAmountsOutOnUniswapForks.
    /// @param _maxSlippageBps The maximum slippage tolerated on the quoted amount, in basis points (50 = 0.5%), below 10000. The transaction reverts if less is received.
    /// @param _deadline Unix timestamp after which the transaction will revert.

    function swapOnUniswapFork(
        address[] calldata _path,
        address _routerAddress,
        uint256 _amountIn,
        uint256 _expectedAmountOut,
        uint256 _maxSlippageBps,
        uint256 _deadline
    ) external validRouter(_routerAddress) {
        require(_path.length >= 2, "Invalid path");
        require(_expectedAmountOut > 0, "Expected amount is zero");
        require(_maxSlippageBps < MAX_BPS, "Slippage must be below 100%");

        uint256 minAmountOut = (_expectedAmountOut *
            (MAX_BPS - _maxSlippageBps)) / MAX_BPS;

        IERC20 tokenIn = IERC20(_path[0]);
        tokenIn.safeTransferFrom(msg.sender, address(this), _amountIn);
        tokenIn.forceApprove(_routerAddress, _amountIn);

        uint256[] memory amounts = IUniswapV2Router02(_routerAddress)
            .swapExactTokensForTokens(
                _amountIn,
                minAmountOut,
                _path,
                msg.sender,
                _deadline
            );

        emit Swap(
            _routerAddress,
            _path,
            _amountIn,
            amounts[amounts.length - 1],
            msg.sender
        );
    }

    /// @notice Find the best deal for swapping tokens on Uniswap, Sushiswap or other forks
    /// @dev _path can have several pairs. Routers that cannot quote the path (e.g. no pool) are skipped.
    /// @param _path An array of token addresses. path.length must be >= 2.
    /// @param _amount QTY of tokens to quote exchange for
    /// @return bestAmountOut The highest quoted output amount, 0 if no router can quote the path
    /// @return bestRouter The router offering bestAmountOut, address(0) if none

    function getBestAmountsOutOnUniswapForks(
        address[] calldata _path,
        uint256 _amount
    ) external view returns (uint256 bestAmountOut, address bestRouter) {
        if (_amount == 0 || _path.length < 2) {
            return (0, address(0));
        }

        uint256 lastHop = _path.length - 1;
        for (uint256 i = 0; i < whiteListedRouters.length; i++) {
            address router = whiteListedRouters[i];
            try
                IUniswapV2Router02(router).getAmountsOut(_amount, _path)
            returns (uint256[] memory amountsOut) {
                if (
                    amountsOut.length == _path.length &&
                    amountsOut[lastHop] > bestAmountOut
                ) {
                    bestAmountOut = amountsOut[lastHop];
                    bestRouter = router;
                }
            } catch {}
        }
    }
}
