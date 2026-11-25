// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IMintable {
    function mint(address _to, uint256 _amount) external;
}

/// @dev Minimal UniswapV2-style router for tests. Each pair is priced at a fixed,
/// configurable rate instead of a constant product curve. A pair without a rate
/// behaves like a missing pool: quotes and swaps revert.
contract MockUniswapV2Router {
    using SafeERC20 for IERC20;

    uint256 public constant RATE_PRECISION = 1e18;

    // tokenIn => tokenOut => amount of tokenOut per tokenIn, scaled by RATE_PRECISION
    mapping(address => mapping(address => uint256)) public rates;

    function setRate(
        address _tokenIn,
        address _tokenOut,
        uint256 _rate
    ) external {
        rates[_tokenIn][_tokenOut] = _rate;
    }

    function getAmountsOut(
        uint256 _amountIn,
        address[] memory _path
    ) public view returns (uint256[] memory amounts) {
        require(_path.length >= 2, "UniswapV2Library: INVALID_PATH");
        amounts = new uint256[](_path.length);
        amounts[0] = _amountIn;
        for (uint256 i = 0; i < _path.length - 1; i++) {
            uint256 rate = rates[_path[i]][_path[i + 1]];
            require(rate > 0, "MockUniswapV2Router: NO_POOL");
            amounts[i + 1] = (amounts[i] * rate) / RATE_PRECISION;
        }
    }

    function swapExactTokensForTokens(
        uint256 _amountIn,
        uint256 _amountOutMin,
        address[] calldata _path,
        address _to,
        uint256 _deadline
    ) external returns (uint256[] memory amounts) {
        require(_deadline >= block.timestamp, "UniswapV2Router: EXPIRED");
        amounts = getAmountsOut(_amountIn, _path);
        require(
            amounts[amounts.length - 1] >= _amountOutMin,
            "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        IERC20(_path[0]).safeTransferFrom(msg.sender, address(this), _amountIn);
        IMintable(_path[_path.length - 1]).mint(
            _to,
            amounts[amounts.length - 1]
        );
    }
}
